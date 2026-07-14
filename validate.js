const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync('index.html','utf8');
const js=html.slice(html.indexOf('const MOVEMENT_FAMILIES='), html.indexOf('\n\nconst CORE='));
const ctx={console,state:{gym:'Travel Gym',replacementPrefs:{}}}; vm.createContext(ctx);
vm.runInContext(js+`\nthis.EXERCISE_LIBRARY=EXERCISE_LIBRARY;this.getMeta=getMeta;this.rankedReplacements=rankedReplacements;this.calculatePlateLoad=calculatePlateLoad;this.canUsePlateCalculator=canUsePlateCalculator;`,ctx);
function assert(c,m){if(!c)throw new Error(m)}
function item(name,swaps=[]){return {id:'x',name,swaps,weight:185}}
for(const name of ['Standing Calf Raise','Seated Calf Raise','Leg Press Calf Raise']){
  const reps=ctx.rankedReplacements(item(name),11); assert(reps.length>0,`no reps for ${name}`);
  assert(reps.every(r=>r.meta.primaryMuscleGroup==='Calves'),`calf mixed ${name}: ${reps.map(r=>r.name)}`);
}
for(const name of ['Cable Curl','EZ-Bar Curl']){
 const reps=ctx.rankedReplacements(item(name),11); assert(reps.every(r=>!['Quads','Calves','Hamstrings'].includes(r.meta.primaryMuscleGroup)),`curl has leg ${name}`);
}
let hack=ctx.rankedReplacements(item('Hack Squat / Leg Press'),11); assert(hack.every(r=>r.meta.movementFamily==='squat'&&r.meta.primaryMuscleGroup==='Quads'), 'hack invalid reps');
let face=ctx.rankedReplacements(item('Face Pull'),11).map(r=>r.name); assert(!face.includes('Band Face Pull'), 'band face pull should not appear');
for(const r of ctx.EXERCISE_LIBRARY){assert(['compound','isolation'].includes(r.exerciseType),`bad type ${r.id}`); if(r.imageAsset)assert(fs.existsSync(r.imageAsset),`missing image ${r.id} ${r.imageAsset}`)}
const ex=[[45,95,[25]],[45,105,[25,5]],[45,135,[45]],[45,175,[45,15,5]],[45,185,[45,25]],[45,225,[45,45]],[35,105,[35]],[35,185,[45,25,5]]];
for(const [bar,target,plates] of ex){const r=ctx.calculatePlateLoad(target,bar); assert(r.exact&&r.achievedWeight===target&&JSON.stringify(r.platesPerSide)===JSON.stringify(plates),`plate ${bar}/${target}: ${JSON.stringify(r)}`)}
let r=ctx.calculatePlateLoad(110,45); assert(!r.exact&&r.lowerOption.weight===105&&r.higherOption.weight===115,'110 nearest');
r=ctx.calculatePlateLoad(180,45); assert(!r.exact&&r.lowerOption.weight===175&&r.higherOption.weight===185,'180 nearest');
assert(ctx.calculatePlateLoad('',45).invalid,'blank invalid'); assert(ctx.calculatePlateLoad(-10,45).invalid,'negative invalid'); assert(ctx.calculatePlateLoad(45.5,45).exact===false,'decimal nonexact'); assert(ctx.calculatePlateLoad(1045,45).achievedWeight===1045,'very high');
assert(ctx.canUsePlateCalculator(item('Bench Press')),'barbell calc shown'); assert(!ctx.canUsePlateCalculator(item('Hack Squat / Leg Press')),'hack hidden'); assert(!ctx.canUsePlateCalculator(item('Cable Curl')),'cable hidden'); assert(!ctx.canUsePlateCalculator(item('DB Bench Press')),'db hidden');
assert(html.includes('BEST REPLACEMENT')&&html.includes('OTHER OPTIONS')&&html.includes('More options'),'swap hierarchy'); assert(/PLATE CALCULATOR/.test(html)&&/TARGET WEIGHT/.test(html)&&/PER SIDE/.test(html),'plate labels');
console.log('validation passed');
