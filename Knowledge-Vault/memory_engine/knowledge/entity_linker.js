// Entity Linking Module
// Links mentions of entities to their canonical forms in the knowledge graph

const entityMap = {};

export function linkEntity(mention, canonicalEntity) {
    if (!entityMap[canonicalEntity]) {
        entityMap[canonicalEntity] = [];
    }
    entityMap[canonicalEntity].push(mention);
}

export function resolveEntity(mention) {
    for (const canonical in entityMap) {
        if (entityMap[canonical].includes(mention)) {
            return canonical;
        }
    }
    return mention;
}
