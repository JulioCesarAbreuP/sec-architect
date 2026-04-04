// js/capacity.js - Capacity and Load Panel
(function(global){
  'use strict';
  var metrics = {loadScore:0, trend:[], saturationRisk:'LOW'};
  function getCPU() {
    if (window.performance && performance.now) return Math.random()*100; // Placeholder
    return 0;
  }
  function getMemory() {
    if (performance.memory) return performance.memory.usedJSHeapSize/(1024*1024);
    return 0;
  }
  function getFPS() {
    return 60; // Placeholder
  }
  function getPayloadSize() {
    return 100; // Placeholder
  }
  function calculateClientLoadScore() {
    var cpu = getCPU();
    var mem = getMemory();
    var fps = getFPS();
    var payload = getPayloadSize();
    var score = Math.min(100, Math.round(cpu*0.4 + mem*0.2 + (60-fps)*0.2 + payload*0.2));
    metrics.loadScore = score;
    metrics.trend.push(score);
    if (metrics.trend.length>20) metrics.trend.shift();
    return score;
  }
  function calculateSaturationRisk(latency, errors) {
    var risk = 'LOW';
    if (metrics.loadScore>80 || (latency && latency>500) || (errors && errors>5)) risk = 'HIGH';
    else if (metrics.loadScore>60) risk = 'MEDIUM';
    metrics.saturationRisk = risk;
    return risk;
  }
  function getCapacityMetrics() {
    return JSON.parse(JSON.stringify(metrics));
  }
  global.Capacity = {
    calculateClientLoadScore: calculateClientLoadScore,
    calculateSaturationRisk: calculateSaturationRisk,
    getCapacityMetrics: getCapacityMetrics
  };
})(window);
