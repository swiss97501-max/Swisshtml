const causalGraph = {};

// เพิ่มความสัมพันธ์เหตุ → ผล
export function addCause(cause, effect) {

    if (!causalGraph[cause]) {
        causalGraph[cause] = [];
    }

    if (!causalGraph[cause].includes(effect)) {
        causalGraph[cause].push(effect);
    }

}

// ดูผลทั้งหมดของสาเหตุหนึ่ง
export function getEffects(cause) {

    return causalGraph[cause] || [];

}

// ดูกราฟทั้งหมด
export function getGraph() {

    return causalGraph;

}
