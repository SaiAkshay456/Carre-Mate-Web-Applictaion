export const extractDetails = (text) => {
    const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/)?.[0];

    const phone = text.match(/(?:\+91[\s-]?|0)?[6-9]\d{9}/)?.[0]; // Covers Indian numbers better

    // Flexible Skills section parser
    const skillsMatch = text.match(/(?:skills|technical skills)[:\s]*([\s\S]*?)(?:\n{2,}|$|education|experience|projects)/i);
    const skills = skillsMatch?.[1]
        ?.split(/[\n,•|]+/)
        ?.map(skill => skill.trim())
        .filter(Boolean);

    // Flexible Education parser
    const educationMatch = text.match(/education[\s\S]*?(?=(\n{2,}|experience|skills|projects|certifications|$))/i);
    const education = educationMatch?.[0]?.trim();

    // Flexible Experience parser
    const experienceMatch = text.match(/experience[\s\S]*?(?=(\n{2,}|education|skills|projects|certifications|$))/i);
    const experience = experienceMatch?.[0]?.trim();

    return { email, phone, skills, education, experience };
};

export function preprocess(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // remove punctuation
        .split(/\s+/)
        .filter(w => !['the', 'is', 'a', 'an', 'of', 'and', 'or'].includes(w));
}

export function cosineSimilarity(vec1, vec2) {
    const dot = vec1.reduce((sum, v, i) => sum + v * (vec2[i] || 0), 0);
    const magnitude = (vec) => Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    return dot / (magnitude(vec1) * magnitude(vec2));
}