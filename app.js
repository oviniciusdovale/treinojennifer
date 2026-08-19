(function () {
  "use strict";

  var DIAS_ARMAZENAMENTO = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  var DIAS_EXIBICAO = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  var K_MARCADOS = "tj.marcados";
  var K_HISTORICO = "tj.historico";
  var K_ULTIMO_PLANO = "tj.ultimoPlano";
  var K_ULTIMO_TREINO = "tj.ultimoTreino";

  // ---------------------------------------------------------------- datas
  // Sempre data local. new Date().toISOString() devolve UTC, o que no Brasil
  // jogaria um treino da noite para o dia seguinte.
  function dataLocal(d) {
    var mes = String(d.getMonth() + 1).padStart(2, "0");
    var dia = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + mes + "-" + dia;
  }

  function deDataLocal(str) {
    var p = str.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function segundaDaSemana(d) {
    var base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var desloc = (base.getDay() + 6) % 7; // domingo (0) vira 6
    base.setDate(base.getDate() - desloc);
    return base;
  }

  function somarDias(d, n) {
    var novo = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    novo.setDate(novo.getDate() + n);
    return novo;
  }

  // ------------------------------------------------------------ persistencia
  function ler(chave, padrao) {
    try {
      var bruto = localStorage.getItem(chave);
      return bruto ? JSON.parse(bruto) : padrao;
    } catch (e) {
      return padrao;
    }
  }

  function gravar(chave, valor) {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch (e) {
      // Armazenamento cheio ou bloqueado: o app continua funcionando na sessão.
    }
  }

  function chaveMarcados(data, planoId, treinoKey) {
    return K_MARCADOS + "." + data + "." + planoId + "." + treinoKey;
  }

  function getMarcados(data, planoId, treinoKey) {
    return ler(chaveMarcados(data, planoId, treinoKey), {});
  }

  function setMarcados(data, planoId, treinoKey, marcados) {
    gravar(chaveMarcados(data, planoId, treinoKey), marcados);
  }

  function getHistorico() {
    var h = ler(K_HISTORICO, []);
    return Array.isArray(h) ? h : [];
  }

  function acharRegistro(historico, data, planoId, treinoKey) {
    for (var i = 0; i < historico.length; i++) {
      var r = historico[i];
      if (r.data === data && r.planoId === planoId && r.treino === treinoKey) return i;
    }
    return -1;
  }

  // Um registro por (data, plano, treino): refinalizar atualiza em vez de duplicar.
  function registrarTreino(data, plano, treino, marcadosIds) {
    var historico = getHistorico();
    var registro = {
      data: data,
      diaSemana: DIAS_ARMAZENAMENTO[deDataLocal(data).getDay()],
      plano: plano.nome,
      planoId: plano.id,
      treino: treino.key,
      treinoLabel: treino.label,
      exerciciosMarcados: marcadosIds
    };
    var i = acharRegistro(historico, data, plano.id, treino.key);
    if (i >= 0) historico[i] = registro;
    else historico.push(registro);
    gravar(K_HISTORICO, historico);
  }

  function removerRegistro(data, planoId, treinoKey) {
    var historico = getHistorico();
    var i = acharRegistro(historico, data, planoId, treinoKey);
    if (i < 0) return;
    historico.splice(i, 1);
    gravar(K_HISTORICO, historico);
  }

  // ------------------------------------------------------------------ estado
  var hoje = dataLocal(new Date());
  var planoAtual = PLANOS[0];
  var treinoAtual = planoAtual.treinos[0];
  var offsetSemana = 0;
  var confirmandoReinicio = false;
  var timerReinicio = null;

  var idPlanoSalvo = localStorage.getItem(K_ULTIMO_PLANO);
  var keyTreinoSalvo = localStorage.getItem(K_ULTIMO_TREINO);
  PLANOS.forEach(function (p) {
    if (p.id === idPlanoSalvo) planoAtual = p;
  });
  planoAtual.treinos.forEach(function (t) {
    if (t.key === keyTreinoSalvo) treinoAtual = t;
  });

  var el = function (id) { return document.getElementById(id); };

  // ------------------------------------------------------------ tela: treino
  function idsMarcados() {
    var marcados = getMarcados(hoje, planoAtual.id, treinoAtual.key);
    return treinoAtual.exercicios
      .filter(function (ex) { return marcados[ex.id]; })
      .map(function (ex) { return ex.id; });
  }

  function renderPlanos() {
    var container = el("planos");
    container.innerHTML = "";
    PLANOS.forEach(function (plano) {
      var btn = document.createElement("button");
      btn.className = "plano" + (plano.id === planoAtual.id ? " ativo" : "");
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", plano.id === planoAtual.id ? "true" : "false");

      var nome = document.createElement("span");
      nome.className = "plano-nome";
      nome.textContent = plano.nome;

      var foco = document.createElement("span");
      foco.className = "plano-foco";
      foco.textContent = plano.foco;

      btn.appendChild(nome);
      btn.appendChild(foco);
      btn.onclick = function () {
        if (plano.id === planoAtual.id) return;
        planoAtual = plano;
        // Mantém a divisão (A/B/C) ao trocar de plano.
        var mesmaDivisao = plano.treinos.filter(function (t) { return t.key === treinoAtual.key; });
        treinoAtual = mesmaDivisao.length ? mesmaDivisao[0] : plano.treinos[0];
        localStorage.setItem(K_ULTIMO_PLANO, plano.id);
        localStorage.setItem(K_ULTIMO_TREINO, treinoAtual.key);
        cancelarConfirmacao();
        renderTreino();
      };
      container.appendChild(btn);
    });
  }

  function renderTabs() {
    var container = el("tabs");
    container.innerHTML = "";
    planoAtual.treinos.forEach(function (treino) {
      var btn = document.createElement("button");
      btn.className = "tab" + (treino.key === treinoAtual.key ? " ativo" : "");
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", treino.key === treinoAtual.key ? "true" : "false");
      btn.textContent = treino.label;
      btn.onclick = function () {
        treinoAtual = treino;
        localStorage.setItem(K_ULTIMO_TREINO, treino.key);
        cancelarConfirmacao();
        renderTreino();
      };
      container.appendChild(btn);
    });
  }

  function criarCardExercicio(ex, feito) {
    var card = document.createElement("button");
    card.className = "exercicio" + (feito ? " feito" : "");
    card.setAttribute("aria-pressed", feito ? "true" : "false");

    var caixa = document.createElement("div");
    caixa.className = "checkbox";
    caixa.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="#1F3329" stroke-width="3">' +
      '<polyline points="4,12 10,18 20,6"/></svg>';

    var texto = document.createElement("div");
    texto.className = "ex-texto";

    var nome = document.createElement("div");
    nome.className = "ex-nome";
    nome.appendChild(document.createTextNode(ex.nome + "  ·  "));
    var series = document.createElement("span");
    series.className = "ex-series";
    series.textContent = ex.series;
    nome.appendChild(series);
    texto.appendChild(nome);

    if (ex.alt) {
      var alt = document.createElement("div");
      alt.className = "ex-alt";
      alt.textContent = ex.alt;
      texto.appendChild(alt);
    }

    card.appendChild(caixa);
    card.appendChild(texto);

    card.onclick = function () {
      var marcados = getMarcados(hoje, planoAtual.id, treinoAtual.key);
      marcados[ex.id] = !marcados[ex.id];
      setMarcados(hoje, planoAtual.id, treinoAtual.key, marcados);

      // Marcou todos: registra sozinha, sem ela precisar tocar em nada.
      var feitos = idsMarcados();
      if (feitos.length === treinoAtual.exercicios.length) {
        registrarTreino(hoje, planoAtual, treinoAtual, feitos);
      }
      cancelarConfirmacao();
      renderTreino();
    };

    return card;
  }

  function renderTreino() {
    renderPlanos();
    renderTabs();

    el("treino-subtitulo").textContent = treinoAtual.subtitulo;

    var marcados = getMarcados(hoje, planoAtual.id, treinoAtual.key);
    var lista = el("lista-exercicios");
    lista.innerHTML = "";
    var feitos = 0;

    treinoAtual.exercicios.forEach(function (ex) {
      var feito = !!marcados[ex.id];
      if (feito) feitos++;
      lista.appendChild(criarCardExercicio(ex, feito));
    });

    var total = treinoAtual.exercicios.length;
    el("progresso-contador").textContent = feitos + "/" + total;
    el("progresso-preenchido").style.width = Math.round((feitos / total) * 100) + "%";

    var registrado = acharRegistro(getHistorico(), hoje, planoAtual.id, treinoAtual.key) >= 0;
    el("registrado").hidden = !registrado;
    el("btn-finalizar").disabled = feitos === 0;
    el("btn-finalizar").textContent = registrado ? "Atualizar treino de hoje" : "Finalizar treino";
  }

  // --------------------------------------------------------- tela: historico
  function renderHistorico() {
    var segunda = somarDias(segundaDaSemana(new Date()), offsetSemana * 7);
    var domingo = somarDias(segunda, 6);

    var mesmoMes = segunda.getMonth() === domingo.getMonth();
    var fmtInicio = segunda.toLocaleDateString("pt-BR", mesmoMes
      ? { day: "numeric" }
      : { day: "numeric", month: "long" });
    var fmtFim = domingo.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    el("semana-intervalo").textContent = fmtInicio + " a " + fmtFim;

    if (offsetSemana === 0) el("semana-rotulo").textContent = "Esta semana";
    else if (offsetSemana === -1) el("semana-rotulo").textContent = "Semana passada";
    else el("semana-rotulo").textContent = Math.abs(offsetSemana) + " semanas atrás";

    el("semana-proxima").disabled = offsetSemana >= 0;

    var historico = getHistorico();
    var lista = el("lista-semana");
    lista.innerHTML = "";
    var totalTreinos = 0;

    for (var i = 0; i < 7; i++) {
      var dia = somarDias(segunda, i);
      var dataStr = dataLocal(dia);
      var doDia = historico.filter(function (r) { return r.data === dataStr; });
      totalTreinos += doDia.length;

      var linha = document.createElement("div");
      linha.className = "dia" +
        (doDia.length ? " com-treino" : "") +
        (dataStr === hoje ? " hoje" : "");

      var nome = document.createElement("span");
      nome.className = "dia-nome";
      nome.textContent = DIAS_EXIBICAO[dia.getDay()];
      linha.appendChild(nome);

      var treinos = document.createElement("span");
      treinos.className = "dia-treinos" + (doDia.length ? "" : " vazio");

      if (!doDia.length) {
        treinos.textContent = "(sem treino)";
      } else {
        doDia.forEach(function (r) {
          var item = document.createElement("div");
          item.className = "dia-treino-linha";
          item.textContent = r.plano + ", " + (r.treinoLabel || "Treino " + r.treino);

          var totalEx = totalExerciciosDe(r);
          var feitos = (r.exerciciosMarcados || []).length;
          if (totalEx && feitos < totalEx) {
            var parcial = document.createElement("span");
            parcial.className = "dia-treino-parcial";
            parcial.textContent = " (" + feitos + "/" + totalEx + ")";
            item.appendChild(parcial);
          }
          treinos.appendChild(item);
        });
      }

      linha.appendChild(treinos);
      lista.appendChild(linha);
    }

    if (totalTreinos === 0) el("total-semana").textContent = "Nenhum treino nesta semana";
    else if (totalTreinos === 1) el("total-semana").textContent = "Total da semana: 1 treino";
    else el("total-semana").textContent = "Total da semana: " + totalTreinos + " treinos";
  }

  function totalExerciciosDe(registro) {
    for (var i = 0; i < PLANOS.length; i++) {
      if (PLANOS[i].id !== registro.planoId) continue;
      var treinos = PLANOS[i].treinos;
      for (var j = 0; j < treinos.length; j++) {
        if (treinos[j].key === registro.treino) return treinos[j].exercicios.length;
      }
    }
    return 0;
  }

  // ------------------------------------------------------------------- acoes
  function cancelarConfirmacao() {
    confirmandoReinicio = false;
    if (timerReinicio) clearTimeout(timerReinicio);
    var btn = el("btn-reiniciar");
    btn.classList.remove("confirmando");
    btn.textContent = "Reiniciar treino de hoje";
  }

  el("btn-finalizar").onclick = function () {
    var feitos = idsMarcados();
    if (!feitos.length) return;
    registrarTreino(hoje, planoAtual, treinoAtual, feitos);
    cancelarConfirmacao();
    renderTreino();
  };

  // Dois toques em vez de confirm() nativo, que trava a webview do iOS.
  el("btn-reiniciar").onclick = function () {
    var btn = el("btn-reiniciar");
    if (!confirmandoReinicio) {
      confirmandoReinicio = true;
      btn.classList.add("confirmando");
      btn.textContent = "Confirmar reinício";
      timerReinicio = setTimeout(cancelarConfirmacao, 4000);
      return;
    }
    // Reiniciar significa que o treino recomeçou: o registro do dia sai junto.
    setMarcados(hoje, planoAtual.id, treinoAtual.key, {});
    removerRegistro(hoje, planoAtual.id, treinoAtual.key);
    cancelarConfirmacao();
    renderTreino();
  };

  el("semana-anterior").onclick = function () {
    offsetSemana--;
    renderHistorico();
  };

  el("semana-proxima").onclick = function () {
    if (offsetSemana >= 0) return;
    offsetSemana++;
    renderHistorico();
  };

  // -------------------------------------------------------------- navegacao
  function mostrarTela(nome) {
    var ehTreino = nome === "treino";
    el("tela-treino").hidden = !ehTreino;
    el("tela-historico").hidden = ehTreino;
    el("nav-treino").classList.toggle("ativo", ehTreino);
    el("nav-historico").classList.toggle("ativo", !ehTreino);
    window.scrollTo(0, 0);
    if (ehTreino) renderTreino();
    else renderHistorico();
  }

  el("nav-treino").onclick = function () { mostrarTela("treino"); };
  el("nav-historico").onclick = function () {
    offsetSemana = 0;
    mostrarTela("historico");
  };

  // Reabrir depois da meia-noite não pode continuar marcando o dia anterior.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) return;
    var agora = dataLocal(new Date());
    if (agora === hoje) return;
    hoje = agora;
    atualizarDataHoje();
    cancelarConfirmacao();
    if (!el("tela-treino").hidden) renderTreino();
    else renderHistorico();
  });

  function atualizarDataHoje() {
    var d = deDataLocal(hoje);
    var texto = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    el("data-hoje").textContent = texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  // ---------------------------------------------------------------- arranque
  atualizarDataHoje();
  mostrarTela("treino");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function () {
        // Sem service worker o app ainda funciona, só perde o modo offline.
      });
    });
  }
})();
