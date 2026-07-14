(function attachIllustrationModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VEKTR_ILLUSTRATIONS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createIllustrationModule() {
  "use strict";

  const SUPPORTED_FAMILIES = new Set([
    "horizontal press", "incline press", "chest fly", "vertical press",
    "lateral raise", "rear-delt raise", "vertical pull", "horizontal pull",
    "straight-arm shoulder extension", "upper-back/rear-delt pull",
    "supinated curl", "neutral-grip curl", "reverse curl", "triceps pushdown",
    "overhead triceps extension", "squat", "unilateral squat/lunge",
    "knee extension", "hip hinge", "knee flexion", "standing calf raise",
    "seated calf raise", "shrug", "loaded carry", "trunk flexion",
    "anti-extension", "anti-rotation", "lateral core",
  ]);

  const SPECIAL_SCENES = {
    "push-up": "push-up",
    "pull-up": "pull-up",
    "assisted-pull-up": "assisted-pull-up",
    "hack-squat": "hack-squat",
    "hack-squat-leg-press": "hack-squat",
    "leg-press": "leg-press",
    "leg-press-calf-raise": "leg-press-calf",
    "hip-thrust": "hip-thrust",
    "glute-bridge": "glute-bridge",
    "step-up": "step-up",
    "bulgarian-split-squat": "split-squat",
    "inverted-row": "inverted-row",
    "seal-row": "prone-row",
    "chest-supported-db-row": "chest-supported-row",
    "chest-supported-barbell-row": "chest-supported-row",
    "chest-supported-row": "chest-supported-row",
    "face-pull": "face-pull",
    "band-face-pull": "face-pull",
    "farmer-carry": "carry",
    "suitcase-carry": "carry",
  };

  const EQUIPMENT_ABBREVIATIONS = {
    Barbell: "BARBELL", Dumbbell: "DUMBBELL", Cable: "CABLE", Machine: "MACHINE",
    "Smith machine": "SMITH", "Trap bar": "TRAP BAR", Kettlebell: "KETTLEBELL",
    Plate: "PLATE", "Resistance band": "BAND", Bodyweight: "BODYWEIGHT",
    "Bench-supported": "BENCH", "EZ bar": "EZ BAR",
  };

  function escapeXml(value) {
    return String(value || "").replace(/[&<>\"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
    })[character]);
  }

  function person(parts) {
    return `<g class="figure" fill="none" stroke="#C8C8CD" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round">${parts}</g>`;
  }

  function red(parts) {
    return `<g fill="none" stroke="#D01822" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round">${parts}</g>`;
  }

  function equipmentGlyph(equipment, x = 136, y = 74) {
    if (equipment === "Dumbbell") return `<g stroke="#74747C" stroke-width="2" fill="none"><path d="M${x-13} ${y}h26"/><path d="M${x-9} ${y-5}v10M${x-6} ${y-5}v10M${x+6} ${y-5}v10M${x+9} ${y-5}v10"/></g>`;
    if (equipment === "Barbell" || equipment === "EZ bar") return `<g stroke="#74747C" stroke-width="2" fill="none"><path d="M${x-25} ${y}h50"/><path d="M${x-20} ${y-7}v14M${x-16} ${y-7}v14M${x+16} ${y-7}v14M${x+20} ${y-7}v14"/></g>`;
    if (equipment === "Cable") return `<g stroke="#74747C" stroke-width="2" fill="none"><path d="M${x+14} ${y-28}v34h-23"/><circle cx="${x+14}" cy="${y-28}" r="3"/><path d="M${x-13} ${y+2}l8 8"/></g>`;
    if (equipment === "Machine" || equipment === "Smith machine") return `<g stroke="#74747C" stroke-width="2" fill="none"><path d="M${x-18} ${y+9}V${y-27}h36v36M${x-12} ${y-20}h24"/></g>`;
    if (equipment === "Kettlebell") return `<g stroke="#74747C" stroke-width="2" fill="none"><path d="M${x-8} ${y-4}a8 8 0 0 1 16 0"/><circle cx="${x}" cy="${y+4}" r="9"/></g>`;
    if (equipment === "Plate") return `<g stroke="#74747C" stroke-width="2" fill="none"><circle cx="${x}" cy="${y}" r="13"/><circle cx="${x}" cy="${y}" r="3"/></g>`;
    if (equipment === "Resistance band") return `<g stroke="#74747C" stroke-width="2" fill="none"><path d="M${x-18} ${y-10}q18 25 36 0"/></g>`;
    if (equipment === "Trap bar") return `<g stroke="#74747C" stroke-width="2" fill="none"><path d="M${x-21} ${y}l8-10h26l8 10-8 10h-26z"/></g>`;
    return "";
  }

  const scenes = {
    "horizontal press": (m) => `<path d="M25 73h93" stroke="#515158" stroke-width="4"/>${person(`<circle cx="51" cy="57" r="7"/><path d="M58 60l39 7M64 63l9-24M88 65l10-24M96 67l15 16"/>`)}${red(`<path d="M73 39h25M68 35v8M103 35v8"/>`)}${equipmentGlyph(m.equipment)}`,
    "incline press": (m) => `<path d="M33 79l55-45M88 79H30" stroke="#515158" stroke-width="4"/>${person(`<circle cx="61" cy="47" r="7"/><path d="M66 52l23 18M72 56l18-25M84 67l18-21M88 70l14 13"/>`)}${red(`<path d="M87 29h28M84 25v8M118 25v8"/>`)}${equipmentGlyph(m.equipment)}`,
    "chest fly": (m) => `<path d="M31 72h91" stroke="#515158" stroke-width="4"/>${person(`<circle cx="54" cy="57" r="7"/><path d="M61 60l38 7M69 63l-25-24M89 65l25-23M98 67l15 16"/>`)}${red(`<path d="M44 39l-5-5M114 42l5-5"/>`)}${equipmentGlyph(m.equipment)}`,
    "vertical press": (m) => `<path d="M66 77h48M78 77V45" stroke="#515158" stroke-width="4"/>${person(`<circle cx="87" cy="29" r="7"/><path d="M87 36v32M86 45L69 24M89 45l18-21M87 68l-12 18M88 68l13 18"/>`)}${red(`<path d="M65 21h46M62 16v10M114 16v10"/>`)}${equipmentGlyph(m.equipment)}`,
    "lateral raise": (m) => `${person(`<circle cx="79" cy="25" r="7"/><path d="M79 32v36M78 42L47 49M80 42l31 7M79 68L65 88M79 68l14 20"/>`)}${red(`<path d="M43 45v8M115 45v8"/>`)}${equipmentGlyph(m.equipment)}`,
    "rear-delt raise": (m) => `<path d="M37 78h47" stroke="#515158" stroke-width="4"/>${person(`<circle cx="83" cy="35" r="7"/><path d="M76 39L52 60M70 45L44 37M57 57l11 26M52 60l-7 23"/>`)}${red(`<path d="M40 33v8M99 52v8M71 45l28 11"/>`)}${equipmentGlyph(m.equipment)}`,
    "vertical pull": (m) => `<path d="M44 16h74M48 12v8M114 12v8" stroke="#74747C" stroke-width="3"/>${person(`<circle cx="82" cy="39" r="7"/><path d="M82 46v31M81 50L57 23M83 50l24-27M82 77L69 89M82 77l13 12"/>`)}${red(`<path d="M58 23l7 8M106 23l-7 8"/>`)}${equipmentGlyph(m.equipment)}`,
    "horizontal pull": (m) => `${person(`<circle cx="72" cy="28" r="7"/><path d="M67 34L48 61M49 61l34 4M59 47l29 2M48 61L37 85M51 61l13 24"/>`)}${red(`<path d="M87 44v10M84 49h31"/>`)}${equipmentGlyph(m.equipment)}`,
    "straight-arm shoulder extension": (m) => `<path d="M32 74h91" stroke="#515158" stroke-width="4"/>${person(`<circle cx="54" cy="58" r="7"/><path d="M61 61l38 6M68 63l21-29M98 67l14 16"/>`)}${red(`<path d="M89 34l20 1"/>`)}${equipmentGlyph(m.equipment)}`,
    "upper-back/rear-delt pull": (m) => `${person(`<circle cx="69" cy="28" r="7"/><path d="M69 35v34M69 45l28-5M69 45l24 13M69 69L56 88M69 69l14 19"/>`)}${red(`<path d="M95 35l13 5-13 5"/>`)}${equipmentGlyph(m.equipment)}`,
    "supinated curl": (m) => `${person(`<circle cx="77" cy="23" r="7"/><path d="M77 30v39M76 41L61 57l15 4M78 41l15 16-15 4M77 69L64 89M77 69l13 20"/>`)}${red(`<path d="M61 61h32"/>`)}${equipmentGlyph(m.equipment)}`,
    "neutral-grip curl": (m) => `${person(`<circle cx="77" cy="23" r="7"/><path d="M77 30v39M76 41L61 58M78 41l15 17M61 58l7-15M93 58l-7-15M77 69L64 89M77 69l13 20"/>`)}${red(`<path d="M65 40v9M89 40v9"/>`)}${equipmentGlyph(m.equipment)}`,
    "reverse curl": (m) => `${person(`<circle cx="77" cy="23" r="7"/><path d="M77 30v39M76 41L61 58l15 3M78 41l15 17-15 3M77 69L64 89M77 69l13 20"/>`)}${red(`<path d="M59 61h36"/>`)}${equipmentGlyph(m.equipment)}`,
    "triceps pushdown": (m) => `${person(`<circle cx="69" cy="23" r="7"/><path d="M69 30v39M68 41l14 16-1 20M70 41l24 16-1 20M69 69L56 89M69 69l13 20"/>`)}${red(`<path d="M79 77h17"/>`)}${equipmentGlyph(m.equipment)}`,
    "overhead triceps extension": (m) => `${person(`<circle cx="77" cy="30" r="7"/><path d="M77 37v34M76 45L68 19l9-10M79 45l8-26-10-10M77 71L64 89M77 71l13 18"/>`)}${red(`<path d="M70 9h14"/>`)}${equipmentGlyph(m.equipment)}`,
    "squat": (m) => `${person(`<circle cx="78" cy="25" r="7"/><path d="M78 32L66 58M66 58l26 13M66 58L52 77M92 71l17 15M52 77H38M109 86h14M70 40l22 2"/>`)}${red(`<path d="M59 39h43M55 35v8M106 35v8"/>`)}${equipmentGlyph(m.equipment)}`,
    "unilateral squat/lunge": (m) => `${person(`<circle cx="72" cy="23" r="7"/><path d="M72 30v36M71 44L55 59M73 44l15 15M72 66L48 79M72 66l24 19M48 79H34M96 85h18"/>`)}${red(`<path d="M45 76l7 7M92 82l7 7"/>`)}${equipmentGlyph(m.equipment)}`,
    "knee extension": (m) => `<path d="M48 70h55M57 70V42" stroke="#515158" stroke-width="4"/>${person(`<circle cx="70" cy="27" r="7"/><path d="M70 34l12 30M81 64l31-2M70 45L56 58"/>`)}${red(`<path d="M111 57v10"/>`)}${equipmentGlyph(m.equipment)}`,
    "hip hinge": (m) => `${person(`<circle cx="83" cy="27" r="7"/><path d="M78 33L52 58M52 58l25 18M52 58L40 86M77 76l14 12M62 48l24 12"/>`)}${red(`<path d="M39 82h53M35 77v10M96 77v10"/>`)}${equipmentGlyph(m.equipment)}`,
    "knee flexion": (m) => `<path d="M34 65h75" stroke="#515158" stroke-width="4"/>${person(`<circle cx="51" cy="51" r="7"/><path d="M58 54l36 8M94 62l20-15M60 57l-8 20"/>`)}${red(`<path d="M110 43l9 7"/>`)}${equipmentGlyph(m.equipment)}`,
    "standing calf raise": (m) => `${person(`<circle cx="77" cy="22" r="7"/><path d="M77 29v41M76 42L64 55M78 42l12 13M77 70L66 89M77 70l12 19"/>`)}${red(`<path d="M62 89h12M85 89h12M68 83l-3 6M90 83l3 6"/>`)}${equipmentGlyph(m.equipment)}`,
    "seated calf raise": (m) => `<path d="M42 70h45M50 70V44" stroke="#515158" stroke-width="4"/>${person(`<circle cx="65" cy="29" r="7"/><path d="M65 36l9 30M74 66h29M65 46L52 58"/>`)}${red(`<path d="M99 66l8 19M104 85h13"/>`)}${equipmentGlyph(m.equipment)}`,
    "shrug": (m) => `${person(`<circle cx="77" cy="22" r="7"/><path d="M77 29v41M76 40L59 64M78 40l17 24M77 70L64 89M77 70l13 19"/>`)}${red(`<path d="M63 38l7-6M91 38l-7-6"/>`)}${equipmentGlyph(m.equipment)}`,
    "loaded carry": (m) => `${person(`<circle cx="76" cy="21" r="7"/><path d="M76 28v42M75 40L57 67M77 40l18 27M76 70L63 90M76 70l16 18"/>`)}${red(`<path d="M49 66h16v13H49zM87 66h16v13H87z"/>`)}${equipmentGlyph(m.equipment)}`,
    "trunk flexion": () => `${person(`<circle cx="68" cy="31" r="7"/><path d="M63 37L47 58M47 58l32 13M47 58L35 82M79 71l20 12"/>`)}${red(`<path d="M59 42q-3 13 9 20"/>`)}`,
    "anti-extension": () => `<path d="M32 80h95" stroke="#515158" stroke-width="3"/>${person(`<circle cx="48" cy="61" r="7"/><path d="M55 63l47 7M65 65L54 81M100 70l16 11"/>`)}${red(`<path d="M67 59h29"/>`)}`,
    "anti-rotation": (m) => `${person(`<circle cx="75" cy="23" r="7"/><path d="M75 30v40M74 43l29 4M76 43l27 14M75 70L62 90M75 70l13 20"/>`)}${red(`<path d="M102 43l17 7M102 57l17-7"/>`)}${equipmentGlyph(m.equipment)}`,
    "lateral core": () => `<path d="M31 81h98" stroke="#515158" stroke-width="3"/>${person(`<circle cx="50" cy="61" r="7"/><path d="M57 63l46 7M68 65L57 81M103 70l15 11"/>`)}${red(`<path d="M68 59l27 5"/>`)}`,
  };

  scenes["push-up"] = () => `<path d="M26 81h112" stroke="#515158" stroke-width="3"/>${person(`<circle cx="113" cy="58" r="7"/><path d="M106 61L61 72M61 72L38 81M96 63l12 18M77 68l8 13"/>`)}${red(`<path d="M91 58l-4 13"/>`)}`;
  scenes["pull-up"] = () => `<path d="M42 15h78M48 11v8M114 11v8" stroke="#74747C" stroke-width="3"/>${person(`<circle cx="81" cy="38" r="7"/><path d="M81 45v34M80 48L57 20M82 48l25-28M81 79L68 91M81 79l13 12"/>`)}${red(`<path d="M57 20l7 9M107 20l-7 9"/>`)}`;
  scenes["assisted-pull-up"] = (m) => `${scenes["pull-up"](m)}<path d="M61 83h40" stroke="#74747C" stroke-width="5"/>`;
  scenes["leg-press"] = () => `<path d="M38 79l30-39M116 23l24 30" stroke="#515158" stroke-width="5"/>${person(`<circle cx="61" cy="48" r="7"/><path d="M56 54L44 72M44 72h31M72 69l28-25M100 44l17 10"/>`)}${red(`<path d="M113 22l24 30"/>`)}`;
  scenes["hack-squat"] = () => `<path d="M45 86L101 12M109 12L53 86" stroke="#515158" stroke-width="4"/>${person(`<circle cx="78" cy="36" r="7"/><path d="M75 43L62 64M62 64l20 13M62 64L50 83M82 77l14 9"/>`)}${red(`<path d="M66 39h25"/>`)}`;
  scenes["leg-press-calf"] = () => `${scenes["leg-press"]()}${red(`<path d="M111 48l9 8"/>`)}`;
  scenes["step-up"] = (m) => `<path d="M91 65h42v24H91z" stroke="#515158" stroke-width="4" fill="none"/>${person(`<circle cx="70" cy="22" r="7"/><path d="M70 29v39M69 43L55 57M71 43l14 14M70 68l21-4M70 68L55 88"/>`)}${red(`<path d="M87 60l8 8"/>`)}${equipmentGlyph(m.equipment)}`;
  scenes["split-squat"] = (m) => `${scenes["unilateral squat/lunge"](m)}<path d="M96 84h32" stroke="#515158" stroke-width="4"/>`;
  scenes["inverted-row"] = () => `<path d="M35 38h98M43 34v8M125 34v8" stroke="#74747C" stroke-width="3"/>${person(`<circle cx="98" cy="55" r="7"/><path d="M91 58L48 75M78 63l-8-25M48 75L30 86"/>`)}${red(`<path d="M70 38h18"/>`)}`;
  scenes["prone-row"] = (m) => `<path d="M34 54h92M43 54v31M116 54v31" stroke="#515158" stroke-width="4"/>${person(`<circle cx="104" cy="42" r="7"/><path d="M97 45L57 50M76 48l5 24M101 47l8 25"/>`)}${red(`<path d="M72 74h46"/>`)}${equipmentGlyph(m.equipment)}`;
  scenes["chest-supported-row"] = (m) => `<path d="M56 79l36-47M45 79h67" stroke="#515158" stroke-width="4"/>${person(`<circle cx="80" cy="34" r="7"/><path d="M75 40L59 61M66 51l25 13M58 61l-9 23"/>`)}${red(`<path d="M88 60l10 8"/>`)}${equipmentGlyph(m.equipment)}`;
  scenes["face-pull"] = (m) => `${person(`<circle cx="70" cy="31" r="7"/><path d="M70 38v34M69 47l20-12M71 47l22 4M70 72L57 89M70 72l13 17"/>`)}${red(`<path d="M89 35l17 7M93 51l13-9"/>`)}${equipmentGlyph(m.equipment)}`;
  scenes["hip-thrust"] = (m) => `<path d="M31 64h44M40 64v22" stroke="#515158" stroke-width="4"/>${person(`<circle cx="55" cy="50" r="7"/><path d="M62 53l39 8M69 56L55 79M101 61l16 22"/>`)}${red(`<path d="M75 54h22"/>`)}${equipmentGlyph(m.equipment)}`;
  scenes["glute-bridge"] = () => `<path d="M29 82h104" stroke="#515158" stroke-width="3"/>${person(`<circle cx="50" cy="67" r="7"/><path d="M57 69l39-13M67 66L55 82M96 56l22 26"/>`)}${red(`<path d="M75 58h19"/>`)}`;
  scenes["carry"] = (m) => scenes["loaded carry"](m);

  function illustrationKey(meta) {
    return SPECIAL_SCENES[meta.id] || meta.movementFamily;
  }

  function canRenderExercise(meta) {
    if (!meta || !meta.id) return false;
    const key = illustrationKey(meta);
    return Boolean(scenes[key]) && SUPPORTED_FAMILIES.has(meta.movementFamily);
  }

  function renderExerciseIllustration(meta) {
    if (!canRenderExercise(meta)) return "";
    const key = illustrationKey(meta);
    const title = `${meta.displayName || meta.name} — ${EQUIPMENT_ABBREVIATIONS[meta.equipment] || meta.equipment}`;
    const scene = scenes[key](meta);
    return `<svg class="exercise-illustration" viewBox="0 0 170 100" role="img" aria-label="${escapeXml(title)}" data-exercise-id="${escapeXml(meta.id)}" data-illustration-key="${escapeXml(key)}" preserveAspectRatio="xMidYMid meet"><title>${escapeXml(title)}</title><rect x="1" y="1" width="168" height="98" rx="14" fill="#0B0B0D" stroke="#29292E"/><path d="M13 87h144" stroke="#202024" stroke-width="1"/>${scene}<text x="12" y="94" fill="#6F6F77" font-size="7" font-family="system-ui,sans-serif" letter-spacing="1">${escapeXml(EQUIPMENT_ABBREVIATIONS[meta.equipment] || String(meta.equipment).toUpperCase())}</text></svg>`;
  }

  return Object.freeze({
    SUPPORTED_FAMILIES,
    SPECIAL_SCENES,
    illustrationKey,
    canRenderExercise,
    renderExerciseIllustration,
  });
});
