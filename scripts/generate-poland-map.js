function generateDetailedPoland64x64() {
    const size = 64;
    let grid = Array.from({ length: size }, () => Array(size).fill(0));

    // Punkty definiujące granice Polski (Y, X) - skala 0-63
    const polandCoords = [
        [3, 20], [2, 25], [1, 35], [2, 42], [4, 48], [9, 56],
        [15, 60], [22, 62], [30, 62], [40, 60], [50, 56], [58, 52],
        [62, 45], [62, 38], [60, 32], [61, 25], [58, 18], [54, 12],
        [48, 8], [40, 5], [32, 3], [22, 3], [12, 6], [6, 12], [3, 20]
    ];

    // Punkty definiujące Mazowsze (Y, X) - kształt bardziej "rogaty" i naturalny
    const mazowszeCoords = [
        [18, 38], [16, 43], [18, 48], [22, 53], [28, 55], [35, 53],
        [40, 48], [42, 42], [40, 36], [35, 32], [28, 31], [22, 34], [18, 38]
    ];

    function isPointInPoly(point, vs) {
        const x = point[0], y = point[1];
        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i][0], yi = vs[i][1];
            const xj = vs[j][0], yj = vs[j][1];
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    // Wypełnianie tablicy
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (isPointInPoly([y, x], mazowszeCoords)) {
                grid[y][x] = 2; // Mazowsze
            } else if (isPointInPoly([y, x], polandCoords)) {
                grid[y][x] = 1; // Polska
            }
        }
    }

    return grid;
}

const polskaArray = generateDetailedPoland64x64();

// Wyświetlenie wyniku w formacie gotowym do kopiowania
console.log("const mapaPolska64x64 = [");
polskaArray.forEach(row => {
    console.log(`  [${row.join(',')}],`);
});
console.log("];");
