export function buildRelations(parsedClaims){

    const edges = [];

    parsedClaims.forEach(claim => {

        if(!claim) return;

        edges.push({

            from: claim.subject,

            relation: claim.predicate,

            to: claim.object

        });

    });

    return edges;

}
