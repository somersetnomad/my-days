/*
  Kinds of activity, and the Ideas list.
  Add your own ideas by copying a line. "seasons" can be any of:
  spring, summer, autumn, winter – or leave it out for "any time".
*/
(function (global) {
  'use strict';

  var CATEGORIES = [
    { id: 'outdoors', label: 'Outdoors & nature', short: 'Outdoors', emoji: '🌿' },
    { id: 'making',   label: 'Making & building', short: 'Making',   emoji: '🔨' },
    { id: 'creative', label: 'Creative',          short: 'Creative', emoji: '🎨' },
    { id: 'people',   label: 'People & community', short: 'People',  emoji: '🤝' },
    { id: 'home',     label: 'Around the house',  short: 'Home',     emoji: '🏡' },
    { id: 'trips',    label: 'Trips out',         short: 'Trips',    emoji: '🚌' },
    { id: 'rest',     label: 'Rest & play',       short: 'Rest',     emoji: '🛋️' }
  ];

  var IDEAS = [
    /* ----- Autumn ----- */
    { emoji: '🍎', title: 'Pick apples and press juice', cat: 'outdoors', seasons: ['autumn'], note: 'Somerset is apple country. Find a local orchard or a friend’s tree and try pressing your own juice.' },
    { emoji: '🌰', title: 'Conker hunt', cat: 'outdoors', seasons: ['autumn'], note: 'Find a horse chestnut tree. Who can find the shiniest conker?' },
    { emoji: '🦌', title: 'Listen for red deer', cat: 'trips', seasons: ['autumn'], note: 'In October, stags roar on Exmoor and the Quantocks. Watch quietly from a long way off.' },
    { emoji: '🍄', title: 'Fungi spotting walk', cat: 'outdoors', seasons: ['autumn'], note: 'Look for mushrooms and toadstools in the woods. Photograph or draw them – look, don’t pick.' },
    { emoji: '🍁', title: 'Make a leaf rainbow', cat: 'creative', seasons: ['autumn'], note: 'Collect fallen leaves and lay them out from green to yellow to red to brown.' },
    { emoji: '🎆', title: 'Bridgwater Carnival', cat: 'trips', seasons: ['autumn'], note: 'Somerset’s famous illuminated carnival in early November. Check this year’s dates.' },
    { emoji: '🐦', title: 'Build a bird feeder', cat: 'making', seasons: ['autumn', 'winter'], note: 'Help garden birds get ready for winter. Then keep a tally of who visits.' },
    { emoji: '🥧', title: 'Bake with apples or blackberries', cat: 'home', seasons: ['autumn'], note: 'Crumble, cake or pie – whatever sounds good.' },

    /* ----- Winter ----- */
    { emoji: '🌀', title: 'Watch a starling murmuration', cat: 'trips', seasons: ['autumn', 'winter'], note: 'Thousands of starlings swirl over the Somerset Levels at dusk (roughly Nov–Feb), around Ham Wall and Shapwick Heath.' },
    { emoji: '🍏', title: 'Go to a wassail', cat: 'people', seasons: ['winter'], note: 'An old Somerset tradition in January: singing to the apple trees for a good harvest.' },
    { emoji: '✨', title: 'Dark-sky stargazing', cat: 'outdoors', seasons: ['winter', 'autumn'], note: 'Exmoor is an International Dark Sky Reserve. Pick a clear night near the new moon and wrap up warm.' },
    { emoji: '🦢', title: 'See the swans at Wells', cat: 'trips', seasons: ['winter', 'spring'], note: 'The swans at the Bishop’s Palace moat ring a bell when they want feeding.' },
    { emoji: '🏮', title: 'Make a solstice lantern', cat: 'creative', seasons: ['winter'], note: 'Celebrate the longest night with a jar lantern or paper lantern.' },
    { emoji: '🕳️', title: 'Explore a cave', cat: 'trips', seasons: ['winter'], note: 'Caves at Wookey Hole and Cheddar stay about the same temperature all year.' },
    { emoji: '🤍', title: 'Snowdrop hunt', cat: 'outdoors', seasons: ['winter'], note: 'From late January, look for snowdrops in churchyards and woods.' },
    { emoji: '🎲', title: 'Board game afternoon', cat: 'rest', seasons: ['winter'], note: 'Hot chocolate and a game. Maybe invent your own rules.' },

    /* ----- Spring ----- */
    { emoji: '🐑', title: 'Visit a farm at lambing time', cat: 'trips', seasons: ['spring'], note: 'Many Somerset farms open up when the lambs arrive.' },
    { emoji: '🐸', title: 'Frogspawn spotting', cat: 'outdoors', seasons: ['spring'], note: 'Check ponds and ditches. Come back each week to see the tadpoles grow.' },
    { emoji: '💙', title: 'Bluebell walk', cat: 'outdoors', seasons: ['spring'], note: 'April to May, ancient woods turn blue. Stick to the paths so they keep growing.' },
    { emoji: '🎶', title: 'Listen to the dawn chorus', cat: 'outdoors', seasons: ['spring'], note: 'Get up before sunrise and listen. How many different birds can you hear?' },
    { emoji: '🌱', title: 'Plant some seeds', cat: 'home', seasons: ['spring'], note: 'Sunflowers, beans or salad. Measure them every few days.' },
    { emoji: '⛰️', title: 'Climb Glastonbury Tor', cat: 'trips', seasons: ['spring', 'summer', 'autumn'], note: 'Look out across the Levels. What can you see from the top?' },
    { emoji: '🐞', title: 'Build a bug hotel', cat: 'making', seasons: ['spring', 'summer'], note: 'Stack sticks, pine cones and hollow stems. Who moves in?' },
    { emoji: '🧺', title: 'Try willow weaving', cat: 'making', seasons: ['spring', 'winter'], note: 'Willow has been grown on the Somerset Levels for centuries. Try a simple star or ball.' },

    /* ----- Summer ----- */
    { emoji: '🍓', title: 'Pick your own strawberries', cat: 'trips', seasons: ['summer'], note: 'The Cheddar valley is famous for strawberries.' },
    { emoji: '🐚', title: 'Fossil hunting at Kilve', cat: 'trips', seasons: ['summer', 'spring'], note: 'Look for ammonites in the loose rocks on the beach. Keep away from the cliffs and check the tide times.' },
    { emoji: '🚲', title: 'Cycle the Strawberry Line', cat: 'outdoors', seasons: ['summer', 'spring', 'autumn'], note: 'A traffic-free path along an old railway line towards Cheddar.' },
    { emoji: '🦇', title: 'Bat walk at dusk', cat: 'outdoors', seasons: ['summer'], note: 'Watch for bats flitting along hedges and rivers as it gets dark.' },
    { emoji: '🐴', title: 'Spot Exmoor ponies', cat: 'trips', seasons: ['summer', 'spring', 'autumn'], note: 'Wild ponies roam the moor. Admire them from a distance – no feeding.' },
    { emoji: '🗼', title: 'Lighthouse on legs', cat: 'trips', seasons: ['summer'], note: 'Visit the wooden lighthouse on the beach at Burnham-on-Sea.' },
    { emoji: '⛺', title: 'Camp in the garden', cat: 'rest', seasons: ['summer'], note: 'Sleep out, listen to the night and look for shooting stars.' },
    { emoji: '🍧', title: 'Make ice lollies', cat: 'home', seasons: ['summer'], note: 'Invent a flavour. Give it a name.' },

    /* ----- Any time ----- */
    { emoji: '📓', title: 'Start a nature journal', cat: 'creative', note: 'Draw or write about one thing you noticed outside today.' },
    { emoji: '🗺️', title: 'Draw a map of where you live', cat: 'creative', note: 'Add secret places, favourite trees and the best puddles.' },
    { emoji: '🏛️', title: 'Visit a museum', cat: 'trips', note: 'Ideas: the Museum of Somerset in Taunton, the Fleet Air Arm Museum at Yeovilton, or Haynes Motor Museum.' },
    { emoji: '🚂', title: 'Ride a steam train', cat: 'trips', note: 'The West Somerset Railway runs heritage steam trains – check when it’s running.' },
    { emoji: '📚', title: 'Library trip', cat: 'trips', note: 'Choose a book about something you’ve never looked into before.' },
    { emoji: '🍞', title: 'Bake bread', cat: 'home', note: 'Kneading is great for busy hands. Watch it rise.' },
    { emoji: '🍝', title: 'Cook a family meal', cat: 'home', note: 'Choose the recipe, make the shopping list, cook it.' },
    { emoji: '🔧', title: 'Fix or take apart something', cat: 'making', note: 'An old radio, a bike, a toy. What’s inside?' },
    { emoji: '🧱', title: 'Build challenge', cat: 'making', note: 'Bricks, cardboard or junk: build the tallest tower, a bridge or a marble run.' },
    { emoji: '💻', title: 'Make a little game', cat: 'making', note: 'Try Scratch or another coding tool and make something you’d enjoy playing.' },
    { emoji: '✉️', title: 'Write to someone', cat: 'people', note: 'A letter or postcard to a friend or grandparent.' },
    { emoji: '🧑‍🤝‍🧑', title: 'Meet up with friends', cat: 'people', note: 'A park, a home ed meet-up or a walk together.' },
    { emoji: '🙋', title: 'Teach someone a skill', cat: 'people', note: 'Something you’re good at – show someone else how.' },
    { emoji: '🎨', title: 'Make a comic', cat: 'creative', note: 'Three boxes is enough to tell a story.' },
    { emoji: '🎵', title: 'Learn a song', cat: 'creative', note: 'Sing it, play it or write your own words to it.' },
    { emoji: '☁️', title: 'Cloud spotting', cat: 'rest', note: 'Lie on your back and watch. What shapes can you find?' },
    { emoji: '🧩', title: 'Jigsaw or puzzle', cat: 'rest', note: 'A calm, quiet one to sink into.' },
    { emoji: '🛋️', title: 'Cosy reading den', cat: 'rest', note: 'Blankets, cushions, a torch and a good book.' },
    { emoji: '🌳', title: 'Build a den outside', cat: 'outdoors', note: 'Sticks, a tarp, some string. Make it your base.' },
    { emoji: '🔍', title: 'Follow a question', cat: 'rest', note: 'What have you been wondering about? Spend some time finding out.' },
    { emoji: '🪴', title: 'Do some gardening', cat: 'home', note: 'Weed, water, plant or just see what’s growing.' },
    { emoji: '🚶', title: 'Wander somewhere new', cat: 'outdoors', note: 'A footpath you’ve never taken. See where it goes.' }
  ];

  // Ideas built from a person's own interests
  var INTEREST_PROMPTS = [
    { emoji: '🔍', pattern: 'Find out something new about {x}' },
    { emoji: '🛠️', pattern: 'Make something to do with {x}' },
    { emoji: '💬', pattern: 'Show someone what I love about {x}' }
  ];

  global.Ideas = { CATEGORIES: CATEGORIES, IDEAS: IDEAS, INTEREST_PROMPTS: INTEREST_PROMPTS };
})(window);
