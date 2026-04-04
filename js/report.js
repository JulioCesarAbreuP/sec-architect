// js/report.js - Consolidated State Report
(function(global){
  'use strict';
  function generateStateReport() {
    var report = {
      resilience: (window.getResilienceState && window.getResilienceState()) || {},
      predictive: (window.Predictive && window.Predictive.getPredictiveSignals && window.Predictive.getPredictiveSignals()) || {},
      capacity: (window.Capacity && window.Capacity.getCapacityMetrics && window.Capacity.getCapacityMetrics()) || {},
      criticalEvents: [],
      timeline: []
    };
    try {
      if (window.Timeline && window.Timeline.getUnifiedTimeline) {
        var all = window.Timeline.getUnifiedTimeline();
        report.criticalEvents = all.filter(function(e){ return e.type==='error'||e.type==='infra'||e.type==='alert'; }).slice(-10);
        report.timeline = all.slice(-20);
      }
    } catch(e){}
    // Defensive: remove sensitive fields
    report.timeline.forEach(function(e){ if(e.details && e.details.sensitive) delete e.details.sensitive; });
    return report;
  }
  global.StateReport = { generateStateReport: generateStateReport };
})(window);
