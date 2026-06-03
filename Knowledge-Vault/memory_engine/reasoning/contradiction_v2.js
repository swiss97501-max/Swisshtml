function normalizeValue(v) {
    return String(v)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

// แปลง claim → structured form
export function toFact(claim) {

    // format: "Earth age is 4.5 billion years"
    const match = claim.match(/(.+?)\s+(is|equals|=)\s+(.+)/i);

    if (!match) return null;

    return {
        entity: normalizeValue(match[1]),
        property: "value",
        value: normalizeValue(match[3])
    };

}

// ตรวจความขัดแย้ง
export function findContradictions(facts) {

    const contradictions = [];

    for (let i = 0; i < facts.length; i++) {
        for (let j = i + 1; j < facts.length; j++) {

            const a = facts[i];
            const b = facts[j];

            if (!a || !b) continue;

            if (
                a.entity === b.entity &&
                a.property === b.property &&
                a.value !== b.value
            ) {
                contradictions.push({
                    entity: a.entity,
                    property: a.property,
                    valueA: a.value,
                    valueB: b.value,
                    reason: "Value mismatch"
                });
            }

        }
    }

    return contradictions;
}
