(function attachProgressModule(root, factory) {
  const exercises = root?.VEKTR_EXERCISES || (typeof require === "function" ? require("./exercises.js") : null);
  const api = factory(exercises);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VEKTR_PROGRESS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createProgressModule(exercises) {
  "use strict";
  if (!exercises) throw new Error("VEKTR exercise library must load before progress");
  const CATEGORY_ORDER = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Quads", "Hamstrings / Glutes", "Calves", "Core", "Other"];
  const exerciseIdFor = (item) => item.exerciseId || exercises.canonicalExerciseId(item.name);

  function sessionEntries(history = []) {
    const entries = [];
    for (const workout of history) {
      for (const item of workout.items || []) if (item.done && !item.skipped) entries.push({ ...item, exerciseId: exerciseIdFor(item), workoutId: workout.id, workoutName: workout.name, date: workout.date, gym: workout.gym });
      for (const core of workout.core || []) if (core.completed) entries.push({ ...core, exerciseId: exerciseIdFor(core), name: core.name, weight: Number(core.weight || 0), sets: [Number(core.actual ?? core.target ?? 0)], target: Number(core.target || 0), done: true, coach: core.coach || "BASELINE", workoutId: workout.id, workoutName: workout.name, date: workout.date, gym: workout.gym, isCore: true });
    }
    return entries;
  }
  const compatibleLoadSemantics = new Set(["total-load", "per-hand"]);
  function volumeFor(entry) {
    const meta = exercises.EXERCISE_BY_ID[entry.exerciseId];
    if (entry.isCore || meta?.loadingType === "bodyweight" || !compatibleLoadSemantics.has(meta?.loadSemantics || "unknown")) return 0;
    return Number(entry.weight || 0) * (entry.sets || []).reduce((sum, reps) => sum + Number(reps || 0), 0);
  }
  function estimatedOneRepMax(weight, reps, exerciseId) { const meta=exercises.EXERCISE_BY_ID[exerciseId]; if(meta && !meta.supportsEstimated1RM) return null; const w=Number(weight),r=Math.max(...(reps||[]).map(Number).filter(Number.isFinite),0); return !w||!r||r>15?null:Math.round(w*(1+r/30)); }

  function personalRecords(history = []) {
    const chronological=sessionEntries(history).slice().reverse(),bestWeight=new Map(),bestOneRepMax=new Map(),bestRepsAtWeight=new Map(),records=[];
    for(const entry of chronological){const id=entry.exerciseId,name=entry.displayNameAtTimeOfWorkout||entry.name,weight=Number(entry.weight||0),maxReps=Math.max(...(entry.sets||[]).map(Number).filter(Number.isFinite),0);
      if(weight>0&&weight>(bestWeight.get(id)||0)){bestWeight.set(id,weight);records.push({type:"weight",exerciseId:id,name,value:weight,date:entry.date,label:`${weight} lb`})}
      const repKey=`${id}::${weight}`;if(maxReps>(bestRepsAtWeight.get(repKey)||0)){bestRepsAtWeight.set(repKey,maxReps);if(weight>0)records.push({type:"reps",exerciseId:id,name,value:maxReps,weight,date:entry.date,label:`${weight} lb × ${maxReps}`})}
      const e1rm=estimatedOneRepMax(weight,entry.sets,id);if(e1rm&&e1rm>(bestOneRepMax.get(id)||0)&&chronological.filter(previous=>previous.exerciseId===id).length>1){bestOneRepMax.set(id,e1rm);records.push({type:"e1rm",exerciseId:id,name,value:e1rm,date:entry.date,label:`Est. 1RM ${e1rm} lb`})}
    }return records.reverse();
  }
  function groupByCategory(history = []) {
    const byExercise=new Map();for(const entry of sessionEntries(history)){if(!byExercise.has(entry.exerciseId))byExercise.set(entry.exerciseId,[]);byExercise.get(entry.exerciseId).push(entry)}
    const categories=new Map();for(const [exerciseId,sessions] of byExercise){const meta=exercises.EXERCISE_BY_ID[exerciseId],category=meta?.progressCategory||(sessions[0].isCore?"Core":"Other"),latest=sessions[0],record={exerciseId,name:latest.displayNameAtTimeOfWorkout||latest.name||meta?.displayName||"Exercise",category,latest,sessions,increasing:["INCREASE","ADD REPS"].includes(latest.coach),status:{INCREASE:"increase","ADD REPS":"increase",REPEAT:"repeat",REDUCE:"reduce"}[latest.coach]||"first"};if(!categories.has(category))categories.set(category,[]);categories.get(category).push(record)}
    return CATEGORY_ORDER.filter(category=>categories.has(category)).map(category=>({category,exercises:categories.get(category).sort((a,b)=>a.name.localeCompare(b.name)),increasing:categories.get(category).filter(entry=>entry.increasing).length}));
  }
  function bodyweightSummary(entries=[]){const valid=entries.filter(entry=>Number.isFinite(Number(entry.value)));if(!valid.length)return null;const latest=valid[0],previous=valid[1];return {latest:Number(latest.value),date:latest.date,change:previous?Number((Number(latest.value)-Number(previous.value)).toFixed(1)):null,entries:valid}}
  function buildProgress(history=[],bodyweight=[]){const entries=sessionEntries(history),groups=groupByCategory(history),prs=personalRecords(history),progressing=groups.reduce((sum,group)=>sum+group.increasing,0),highlights=[],highlighted=new Set();for(const entry of entries){if(highlights.length>=3)break;if(highlighted.has(entry.exerciseId))continue;const name=entry.displayNameAtTimeOfWorkout||entry.name;if(entry.coach==="INCREASE"){highlights.push({date:entry.date,text:`${name} earned an increase · Next target: ${entry.next} lb`,status:"increase"});highlighted.add(entry.exerciseId)}else if(entry.coach==="ADD REPS"){highlights.push({date:entry.date,text:`${name} earned more reps · Next target: ${entry.nextTarget} reps`,status:"increase"});highlighted.add(entry.exerciseId)}else if(entry.coach==="REDUCE"){highlights.push({date:entry.date,text:`${name} adjusted to ${entry.next} lb`,status:"reduce"});highlighted.add(entry.exerciseId)}}return {summary:{workouts:history.length,totalVolume:Math.round(entries.reduce((sum,entry)=>sum+volumeFor(entry),0)),progressing,recentPrs:prs.slice(0,3).length},highlights,groups,prs,bodyweight:bodyweightSummary(bodyweight),entries}}
  function exerciseDetails(history,exerciseId){const allSessions=sessionEntries(history).filter(entry=>entry.exerciseId===exerciseId);const sessions=allSessions.slice(0,6);if(!sessions.length)return null;const bestWeight=Math.max(...allSessions.map(entry=>Number(entry.weight||0))),bestOneRepMax=Math.max(...allSessions.map(entry=>estimatedOneRepMax(entry.weight,entry.sets,exerciseId)||0));return {exerciseId,name:sessions[0].displayNameAtTimeOfWorkout||sessions[0].name,category:exercises.EXERCISE_BY_ID[exerciseId]?.progressCategory||"Other",latest:sessions[0],sessions,bestWeight,bestOneRepMax:bestOneRepMax||null}}
  return Object.freeze({CATEGORY_ORDER,exerciseIdFor,sessionEntries,volumeFor,estimatedOneRepMax,personalRecords,groupByCategory,bodyweightSummary,buildProgress,exerciseDetails});
});
