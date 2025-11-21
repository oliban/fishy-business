

// Mock DOM
global.document = {
    getElementById: () => ({
        getContext: () => ({}),
        classList: { add: () => { }, remove: () => { } },
        addEventListener: () => { },
        style: {}
    }),
    createElement: () => ({
        getContext: () => ({}),
        width: 0,
        height: 0
    })
};
global.window = {
    addEventListener: () => { }
};
global.requestAnimationFrame = () => { };
global.Image = class { };

// Load game.js
const fs = require('fs');
const gameCode = fs.readFileSync('./game.js', 'utf8');
eval(gameCode);

// Check ARCHETYPES
console.log('Checking ARCHETYPES.octopus...');
if (ARCHETYPES && ARCHETYPES.octopus) {
    console.log('ARCHETYPES.octopus found.');
    console.log('special:', ARCHETYPES.octopus.special);
    console.log('inkCooldown:', ARCHETYPES.octopus.inkCooldown);
} else {
    console.error('ARCHETYPES.octopus NOT found!');
}
