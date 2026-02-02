
import { GoogleGenAI } from "@google/genai";
import { EssayRequest } from "../types";

export const generateEssay = async (request: EssayRequest): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    let systemInstruction = `Atue como um redator profissional. Escreva um(a) ${request.type} sobre o tema: "${request.topic}". 
    O tom deve ser ${request.tone}. Responda em Português do Brasil com formatação Markdown clara.`;

    if (request.humanize) {
      systemInstruction += `\n\nATENÇÃO - MODO HUMANIZADO ATIVADO: 
      Escreva o texto como se fosse uma pessoa comum escrevendo rapidamente. 
      Use um vocabulário um pouco mais simples. 
      Introduza propositalmente pequenos "erros" naturais de escrita humana, como:
      - Ocasionalmente esquecer uma vírgula onde deveria haver uma.
      - Colocar uma vírgula onde não deveria.
      - Uma pontuação levemente fora do padrão formal perfeito.
      - Evite ser excessivamente "robótico" ou perfeito demais. O texto deve parecer autêntico e orgânico.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: systemInstruction,
      config: {
        temperature: request.humanize ? 0.9 : 0.7,
        topP: 0.95,
      }
    });

    return response.text || "Não foi possível gerar o texto no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Erro ao gerar conteúdo. Verifique sua conexão.");
  }
};
