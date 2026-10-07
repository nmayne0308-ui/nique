// Checklist content, paraphrased from the American Red Cross Hurricane
// Preparedness Checklist (redcross.org/prepare).
// `h` = hours before arrival by which a "before" item should be done.
// h: null means "do this well ahead of any storm".
const CHECKLIST = {
  before: [
    { id: "b-alerts", t: "Sign up for free local government emergency alerts", h: null },
    { id: "b-evac", t: "Write down where you'd evacuate to, how you'd get there and where you'd stay", h: null },
    { id: "b-help", t: "Arrange help in advance if you need assistance or public transit to leave", h: null },
    { id: "b-mobile", t: "Mobile/manufactured homes, trailers and RVs are not safe in high wind: plan to leave", h: null },
    { id: "b-shelter", t: "Pick a wind shelter, or a small windowless room on the lowest level of a sturdy building that won't flood", h: null },
    { id: "b-team", t: "Set up a personal support team: people you'll help and people who'll help you", h: null },
    { id: "b-skills", t: "Learn first aid and CPR", h: null },
    { id: "b-power", t: "Plan for days without power, gas, water, phone and internet, including medical equipment and phone charging", h: null },
    { id: "b-insurance", t: "Review insurance policies with your agent", h: null },
    { id: "b-records", t: "Keep personal, financial and medical records safe and reachable (paper or securely backed up)", h: null },
    { id: "b-medlist", t: "Put a list of your medications and dosages on a card to carry", h: null },
    { id: "b-trees", t: "Trim or remove trees close enough to fall on the house", h: 96 },
    { id: "b-gutters", t: "Clear drains, gutters and downspouts", h: 96 },
    { id: "b-barrier", t: "Stock plastic sheeting and sandbags", h: 72 },
    { id: "b-kits", t: "Fill your Go-Kit (3+ days) and Stay-at-Home Kit (2+ weeks); see Supplies", h: 72 },
    { id: "b-meds", t: "Get a 1-month supply of medication in child-proof containers, plus medical supplies", h: 72 },
    { id: "b-radio", t: "Have a battery radio, and backup batteries or chargers for phones and medical devices", h: 72 },
    { id: "b-windows", t: "Cover windows with permanent shutters or sheeting", h: 48 },
    { id: "b-outdoor", t: "Bring in or secure loose outdoor items (furniture, trash cans)", h: 36 },
    { id: "b-anchor", t: "Anchor what can't come inside, like gas grills and propane tanks", h: 36 },
    { id: "b-monitor", t: "Monitor local weather and news; know the difference: WATCH = be prepared, WARNING = take action", h: 24 },
    { id: "b-charge", t: "Charge phones, power banks and medical devices", h: 24 },
    { id: "b-leave", t: "If officials advise evacuation: go immediately with your Go-Kit", h: 12 }
  ],
  during: [
    { id: "d-evac", t: "If told to evacuate, leave right away with your Go-Kit" },
    { id: "d-route", t: "Stick to official evacuation routes; no shortcuts, they may be blocked" },
    { id: "d-shelters", t: "Check with local officials for shelter locations (the Red Cross Emergency App can help)" },
    { id: "d-shelter", t: "Otherwise shelter in a designated wind shelter or an interior room" },
    { id: "d-glass", t: "Stay away from windows and glass doors" },
    { id: "d-high", t: "Move to higher ground before flooding starts" },
    { id: "d-water", t: "Never walk, swim or drive through floodwater. Turn Around, Don't Drown!" }
  ],
  after: [
    { id: "a-wait", t: "Wait for officials to say it's safe before returning home" },
    { id: "a-lines", t: "Stay away from downed power lines and poles; they can electrocute" },
    { id: "a-flood", t: "Don't touch floodwater; it can carry sewage, bacteria and chemicals" },
    { id: "a-light", t: "Use flashlights or battery lanterns, not candles, to cut fire risk" },
    { id: "a-co", t: "Never run gas, propane, natural gas or charcoal devices indoors, in a garage, tent or camper, or near an open window: carbon monoxide kills fast. Feeling sick, dizzy or weak? Get fresh air now." },
    { id: "a-food", t: "When in doubt, throw it out: discard food that got wet or warm" },
    { id: "a-fridge", t: "Ask your doctor or pharmacist about refrigerated medicines" },
    { id: "a-drink", t: "Check with the local health department before drinking tap water" },
    { id: "a-ppe", t: "Wear gloves, goggles and boots for cleanup; disinfect everything that got wet" },
    { id: "a-partner", t: "Work with a partner on heavy debris; only use chainsaws etc. if trained" },
    { id: "a-pace", t: "Pace yourself and take breaks; heart attacks are a leading cause of post-hurricane deaths" },
    { id: "a-mental", t: "Stress and anxiety are normal: eat, sleep, and call/text the Disaster Distress Helpline 1-800-985-5990" }
  ]
};

// Default supplies. `per` = multiplier by household size (0 = fixed count).
const DEFAULT_SUPPLIES = [
  { name: "Drinking water (gallons; ~1 per person per day)", kit: "go", per: 3, base: 0 },
  { name: "Drinking water (gallons; ~1 per person per day)", kit: "home", per: 14, base: 0 },
  { name: "Non-perishable food (days of meals)", kit: "go", per: 3, base: 0 },
  { name: "Non-perishable food (days of meals)", kit: "home", per: 14, base: 0 },
  { name: "Medication (days' supply)", kit: "go", per: 3, base: 0 },
  { name: "Medication (30-day supply, child-proof container)", kit: "home", per: 0, base: 1 },
  { name: "Medication list card", kit: "go", per: 0, base: 1 },
  { name: "Phone charger and backup battery", kit: "go", per: 0, base: 1 },
  { name: "Backup batteries / chargers for medical devices", kit: "go", per: 0, base: 1 },
  { name: "First-aid kit", kit: "go", per: 0, base: 1 },
  { name: "Flashlight", kit: "go", per: 0, base: 1 },
  { name: "Battery-powered radio", kit: "home", per: 0, base: 1 },
  { name: "Flashlights / battery lanterns", kit: "home", per: 0, base: 2 },
  { name: "Spare batteries", kit: "home", per: 0, base: 8 },
  { name: "Records (ID, insurance, medical): paper or backed up", kit: "go", per: 0, base: 1 },
  { name: "Plastic sheeting", kit: "home", per: 0, base: 1 },
  { name: "Sandbags", kit: "home", per: 0, base: 10 },
  { name: "Gloves, goggles, boots for cleanup", kit: "home", per: 1, base: 0 }
];
