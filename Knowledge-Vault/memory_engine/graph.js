export function buildGraph(claims) {

    const nodes = [];
    const edges = [];

    claims.forEach(claim => {

        nodes.push({
            id: claim.id,
            label: claim.original
        });

    });

    return {
        nodes,
        edges
    };

}
