import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Platform = "instagram" | "facebook" | "linkedin" | "x" | "tiktok";
type Tone = "inspirador" | "profissional" | "descontraido" | "urgente" | "educativo" | "persuasivo";

export interface CopyResult {
  captions: string[];
  hashtags: string[];
  ideas: string[];
  cta: string;
}

const inputSchema = z.object({
  topic: z.string().trim().min(2).max(200),
  platform: z.enum(["instagram", "facebook", "linkedin", "x", "tiktok"]),
  tone: z.enum([
    "inspirador",
    "profissional",
    "descontraido",
    "urgente",
    "educativo",
    "persuasivo",
  ]),
});

export const generateCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    return generate(data.topic.trim(), data.platform, data.tone);
  });

function generate(topic: string, platform: Platform, tone: Tone): CopyResult {
  const seed = topic.length * 7 + platform.charCodeAt(0) * 13 + tone.charCodeAt(0) * 19;

  const openers: Record<Tone, string[]> = {
    inspirador: [
      `E se ${topic} fosse o começo de algo maior?`,
      `A gente adia, a gente espera — mas ${topic} não vai esperar.`,
      `Tem uma versão sua que vive ${topic} sem medo. Que tal apresentá-la?`,
    ],
    profissional: [
      `Direto ao ponto: ${topic} exige método.`,
      `O mercado fala muito sobre ${topic}. Poucos fazem direito.`,
      `Resultados em ${topic} não nascem de achismo.`,
    ],
    descontraido: [
      `Confessa: ${topic} também vive na sua cabeça de graça, né?`,
      `Rolo de falar de ${topic}, mas alguém precisava dizer.`,
      `${topic}? Sim. Com café e sem drama.`,
    ],
    urgente: [
      `Para de adiar ${topic}. O tempo não vai voltar.`,
      `Hoje é o dia. ${topic} não combina com "depois".`,
      `Se não for agora, quando? ${topic} espera, mas a concorrência não.`,
    ],
    educativo: [
      `3 coisas sobre ${topic} que mudaram minha forma de pensar.`,
      `Você provavelmente faz ${topic} errado — e tudo bem. Vamos consertar.`,
      `Aula rápida: ${topic} sem enrolação.`,
    ],
    persuasivo: [
      `Eu era cético com ${topic}. Até ver o que acontece quando você leva a sério.`,
      `${topic} não é sobre querer. É sobre decidir.`,
      `A diferença entre quem fica e quem avança em ${topic} é uma escolha.`,
    ],
  };

  const closers: Record<Platform, string[]> = {
    instagram: [
      `Salva pra não perder. 📌`,
      `Comenta qual parte fez mais sentido. 👇`,
      `Compartilha com quem precisa ver isso hoje.`,
    ],
    facebook: [
      `Conta nos comentários o que você acha.`,
      `Marca alguém que vive essa rotina.`,
      `Compartilha no seu feed se fez sentido.`,
    ],
    linkedin: [
      `Qual foi a sua experiência com isso? Comenta aqui embaixo.`,
      `Recomenda para alguém que está começando agora.`,
      `Salva e volta quando precisar.`,
    ],
    x: [`RT se concordar.`, `Qual a sua? Te respondo aqui.`, `Salva pra depois.`],
    tiktok: [
      `Segura o vídeo e comenta a tua! 🎬`,
      `Dá FYP compartilhando com a pessoa certa.`,
      `Salva antes de passar. ✨`,
    ],
  };

  const hashtagPool: Record<Platform, string[]> = {
    instagram: [
      "marketing",
      "socialmedia",
      "conteudo",
      "criacao",
      "empresarial",
      "crescimento",
      "marca",
      "copywriting",
      "estrategia",
      "instagram",
      "reels",
      "tendencias",
    ],
    facebook: ["marketing", "negocios", "conteudo", "comunidade", "empresas"],
    linkedin: [
      "linkedin",
      "carreira",
      "negocios",
      "networking",
      "lideranca",
      "marketing",
      "gestao",
    ],
    x: ["marketing", "opiniao", "debate", "tendencias", "twitter"],
    tiktok: ["tiktok", "fyp", "viral", "conteudo", "criadores", "marketing", "dicas"],
  };

  const ideas: string[] = [
    `Carrossel: mitos e verdades sobre ${topic}.`,
    `Nos bastidos: como ${topic} funciona na prática.`,
    `Depoimento: um cliente contando a virada com ${topic}.`,
    `Antes e depois do processo de ${topic}.`,
    `Pergunta para a audiência: o que te trava em ${topic}?`,
  ];

  const ctaPool: Record<Tone, string> = {
    inspirador: "Comenta: qual seria o seu primeiro passo?",
    profissional: "Agende um diagnóstico sem compromisso. Link na bio.",
    descontraido: "Me marca aqui embaixo se isso fez sentido 😄",
    urgente: "Vagas limitadas. Garanta a sua agora pelo link na bio.",
    educativo: "Salva esse post pra consultar quando precisar.",
    persuasivo: "Chama no direct que eu te mostro o caminho.",
  };

  const captions: string[] = [];
  const openerSet = shuffle(openers[tone], seed);
  const closerSet = shuffle(closers[platform], seed + 11);
  for (let i = 0; i < 4; i++) {
    captions.push(`${openerSet[i % openerSet.length]}\n\n${closerSet[i % closerSet.length]}`);
  }

  const maxTags = platform === "instagram" ? 10 : platform === "tiktok" ? 7 : 5;
  const hashtags = shuffle(hashtagPool[platform], seed + 23)
    .slice(0, maxTags)
    .map((h) => `#${h}`);

  return {
    captions: captions.map((c) => `${c}\n${ctaPool[tone]}`),
    hashtags,
    ideas,
    cta: ctaPool[tone],
  };
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const pool = [...arr];
  let s = seed % 233280;
  if (s < 0) s += 233280;
  for (let i = pool.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool;
}
