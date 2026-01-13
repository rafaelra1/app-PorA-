
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from 'dotenv';
import * as fs from "node:fs";

// Load environment variables
config({ path: '.env.local' });

async function main() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ Erro: GEMINI_API_KEY não encontrada no .env.local");
        process.exit(1);
    }

    console.log("🍌 Testando Geração de Imagem com SDK @google/generative-ai (Nana Banana Style)...");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // Testando modelo especificado pelo usuário
        const modelName = "gemini-1.5-flash"; // Changing to a known valid model for now to test SDK config

        console.log(`🤖 Iniciando modelo: ${modelName}`);

        const model = genAI.getGenerativeModel({ model: modelName });

        console.log(`🤖 Iniciando modelo: ${modelName}`);

        const prompt = "A cute robot eating a banana in a white background, 3d render style";

        console.log("🎨 Enviando prompt...");

        const response = await model.generateContent(prompt);

        console.log("📡 Resposta recebida. Analisando estrutura...");

        if (!response.candidates || response.candidates.length === 0) {
            console.error("❌ Nenhum candidato retornado.");
            return;
        }

        const parts = response.candidates[0].content.parts;
        let imageSaved = false;

        for (const part of parts) {
            if (part.text) {
                console.log("📝 Texto retornado:", part.text);
            }

            if (part.inlineData) {
                console.log("🖼️ Imagem detectada!");
                const imageData = part.inlineData.data;
                const buffer = Buffer.from(imageData, "base64");
                fs.writeFileSync("test-output-image.png", buffer);
                console.log("✅ Imagem salva como: test-output-image.png");
                imageSaved = true;
            }

            console.log("🔍 Part keys:", Object.keys(part));
        }

        if (!imageSaved) {
            console.log("⚠️ A resposta foi processada, mas nenhuma imagem in-line foi encontrada.");
        }

    } catch (error) {
        console.error("\n❌ Erro Fatal no SDK:");
        console.error(error.message);
        if (error.status === 404) {
            console.error("💡 DIAGNÓSTICO: O erro 404 confirma que o modelo 'gemini-2.5-flash-image' ainda não está disponível publicamente para sua API Key.");
        }
    }
}

main();
