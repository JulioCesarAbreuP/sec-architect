// js/predictive.js - Predictive Observability Module
(function(global){
  'use strict';
  var signals = {trends:[], anomalies:[], prediction:null};
  function stddev(arr) {
    if (!arr.length) return 0;
    var avg = arr.reduce((a,b)=>a+b,0)/arr.length;
    var sq = arr.map(x=>(x-avg)*(x-avg));
    return Math.sqrt(sq.reduce((a,b)=>a+b,0)/arr.length);
  }
  function movingWindow(arr, size) {
    var out = [];
    for (var i=0; i<=arr.length-size; ++i) out.push(arr.slice(i,i+size));
    return out;
  }
  function detectTrends(opts) {
    signals.trends = [];
    try {
      var lat = (opts && opts.latency) || [];
      if (lat.length > 2) {
        var trend = lat[lat.length-1] - lat[0];
        signals.trends.push({type:'latency', trend:trend});
      }
      var errs = (opts && opts.clientErrors) || [];
      if (errs.length > 2) {
        var trend = errs[errs.length-1] - errs[0];
        signals.trends.push({type:'clientErrors', trend:trend});
      }
      var infra = (opts && opts.infraPeaks) || [];
      if (infra.length > 2) {
        var trend = infra[infra.length-1] - infra[0];
        signals.trends.push({type:'infraPeaks', trend:trend});
      }
      var alerts = (opts && opts.alerts) || [];
      if (alerts.length > 2) {
        var trend = alerts[alerts.length-1] - alerts[0];
        signals.trends.push({type:'alerts', trend:trend});
      }
    } catch(e){}
  }
  function detectAnomalies(opts) {
    signals.anomalies = [];
    try {
      var lat = (opts && opts.latency) || [];
      if (lat.length > 5) {
        var sd = stddev(lat);
        var avg = lat.reduce((a,b)=>a+b,0)/lat.length;
        lat.forEach(function(v,i){
          if (Math.abs(v-avg) > 2*sd) signals.anomalies.push({type:'latency', idx:i, value:v});
        });
      }
      var win = movingWindow(lat,3);
      win.forEach(function(w,i){
        if (w[2]-w[0]>avg*0.5) signals.anomalies.push({type:'latency_jump', idx:i+2, value:w[2]});
      });
    } catch(e){}
  }
  function predictDegradation() {
    // Simple: if >2 latency anomalies or trend up, predict DEGRADED
    var latAnom = signals.anomalies.filter(a=>a.type==='latency'||a.type==='latency_jump').length;
    var latTrend = signals.trends.find(t=>t.type==='latency');
    if (latAnom>2 || (latTrend && latTrend.trend>100)) signals.prediction = 'DEGRADED';
    else signals.prediction = 'NORMAL';
  }
  function getPredictiveSignals() {
    return JSON.parse(JSON.stringify(signals));
  }
  global.Predictive = {
    detectTrends: detectTrends,
    detectAnomalies: detectAnomalies,
    predictDegradation: predictDegradation,
    getPredictiveSignals: getPredictiveSignals
  };
})(window);
