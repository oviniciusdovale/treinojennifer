// Planos de treino da Jennifer.
// Core escolhido para diástase abdominal em recuperação: apenas anti-extensão e
// anti-rotação (dead bug, bird dog, prancha lateral modificada). Nada de crunch.
// Ao adicionar exercícios de core no futuro, manter essa mesma lógica.

const PLANOS = [
  {
    id: "p1",
    nome: "Plano 1",
    foco: "Glúteo e perna",
    treinos: [
      {
        key: "A",
        label: "Treino A",
        subtitulo: "Posterior de coxa + push + core",
        exercicios: [
          { id: "p1a1", nome: "Leg press 45°", series: "3x12", alt: "ou afundo com halteres" },
          { id: "p1a2", nome: "Mesa flexora", series: "3x12", alt: "ou stiff com halteres" },
          { id: "p1a3", nome: "Cadeira adutora", series: "3x15", alt: "" },
          { id: "p1a4", nome: "Puxada alta (pulldown)", series: "3x12", alt: "ou remada curvada com halteres" },
          { id: "p1a5", nome: "Dead bug (core)", series: "3x10 cada lado", alt: "" }
        ]
      },
      {
        key: "B",
        label: "Treino B",
        subtitulo: "Quadríceps/glúteo + pull + core",
        exercicios: [
          { id: "p1b1", nome: "Agachamento Smith ou Hack", series: "3x12", alt: "ou agachamento livre com halteres" },
          { id: "p1b2", nome: "Cadeira extensora", series: "3x12", alt: "" },
          { id: "p1b3", nome: "Elevação pélvica (hip thrust)", series: "3x12", alt: "máquina ou barra no quadril" },
          { id: "p1b4", nome: "Desenvolvimento de ombro", series: "3x12", alt: "máquina ou halteres sentada" },
          { id: "p1b5", nome: "Prancha lateral modificada", series: "3x20-30seg", alt: "apoio no joelho se precisar" }
        ]
      },
      {
        key: "C",
        label: "Treino C",
        subtitulo: "Glúteo isolado + upper + core",
        exercicios: [
          { id: "p1c1", nome: "Cadeira abdutora", series: "3x15", alt: "" },
          { id: "p1c2", nome: "Cadeira flexora ou stiff", series: "3x12", alt: "com halteres" },
          { id: "p1c3", nome: "Glute kickback (4 apoios)", series: "3x12 cada lado", alt: "ou coice no cabo/caneleira" },
          { id: "p1c4", nome: "Remada baixa no cabo", series: "3x12", alt: "ou remada unilateral com halter" },
          { id: "p1c5", nome: "Bird dog + respiração", series: "3x10 cada lado", alt: "+ 2min respiração" }
        ]
      }
    ]
  },
  {
    id: "p2",
    nome: "Plano 2",
    foco: "Braço, costas e peito",
    treinos: [
      {
        key: "A",
        label: "Treino A2",
        subtitulo: "Peito + tríceps + perna leve",
        exercicios: [
          { id: "p2a1", nome: "Supino reto na máquina", series: "3x12", alt: "ou halteres no banco" },
          { id: "p2a2", nome: "Peck deck (crucifixo na máquina)", series: "3x12", alt: "ou crucifixo inclinado com halteres" },
          { id: "p2a3", nome: "Tríceps na polia (pushdown)", series: "3x12", alt: "ou tríceps francês com halteres" },
          { id: "p2a4", nome: "Tríceps coice (kickback) com halteres", series: "3x12 cada lado", alt: "" },
          { id: "p2a5", nome: "Cadeira extensora", series: "3x12", alt: "manutenção de perna" }
        ]
      },
      {
        key: "B",
        label: "Treino B2",
        subtitulo: "Costas + bíceps + perna leve",
        exercicios: [
          { id: "p2b1", nome: "Puxada alta (pulldown)", series: "3x12", alt: "ou remada curvada com halteres" },
          { id: "p2b2", nome: "Remada baixa no cabo", series: "3x12", alt: "ou remada unilateral com halter" },
          { id: "p2b3", nome: "Rosca direta", series: "3x12", alt: "barra W ou halteres" },
          { id: "p2b4", nome: "Rosca martelo", series: "3x12 cada lado", alt: "" },
          { id: "p2b5", nome: "Mesa flexora", series: "3x12", alt: "manutenção de perna" }
        ]
      },
      {
        key: "C",
        label: "Treino C2",
        subtitulo: "Ombro + braço completo + glúteo",
        exercicios: [
          { id: "p2c1", nome: "Desenvolvimento de ombro na máquina", series: "3x12", alt: "ou halteres sentada" },
          { id: "p2c2", nome: "Elevação lateral com halteres", series: "3x15", alt: "" },
          { id: "p2c3", nome: "Combinado bíceps/tríceps", series: "3x10 cada", alt: "rosca + extensão, sem descanso entre os dois" },
          { id: "p2c4", nome: "Elevação pélvica (hip thrust)", series: "3x12", alt: "manutenção de glúteo" },
          { id: "p2c5", nome: "Dead bug (core)", series: "3x10 cada lado", alt: "" }
        ]
      }
    ]
  }
];
