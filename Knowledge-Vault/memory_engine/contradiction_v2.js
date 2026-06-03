export function findPropertyContradictions(claims) {

    const contradictions = [];

    for (let i = 0; i < claims.length; i++) {

        for (let j = i + 1; j < claims.length; j++) {

            const a = claims[i];
            const b = claims[j];

            if (
                a.entity === b.entity &&
                a.property === b.property &&
                a.value !== b.value
            ) {

                contradictions.push({
                    type: "PROPERTY_CONFLICT",

                    entity: a.entity,

                    property: a.property,

                    valueA: a.value,

                    valueB: b.value,

                    claimA: a.id,

                    claimB: b.id
                });

            }

        }

    }

    return contradictions;

}
