function oppositeDirection(direction) {
    switch (direction) {
        case 0: return 2; break;
        case 1: return 3; break;
        case 2: return 0; break;
        case 3: return 1; break;
    }
}

function decide(blob) {
    if (blob.health >= ownBlob.health) {
        blob.direction = oppositeDirection(ownBlob.direction);
    }
}