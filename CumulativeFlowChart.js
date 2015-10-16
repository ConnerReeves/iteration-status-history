(function(){
    var Ext = window.Ext4 || window.Ext;

    Ext.define("CumulativeFlowChart", {
        alias: "widget.statsbannercumulativeflowchart",
        extend: "Ext.Container",
        requires: [
            'Rally.ui.chart.Chart'
        ],
        layout: 'fit',
        
        initComponent: function() {
            this.callParent(arguments);
            
            this.add({
                xtype: 'rallychart',
                loadMask: false,
                chartConfig: {
                    chart: {
                        type: 'area',
                        height: this.height,
                        width: this.width
                    },
                    legend: { enabled: false },
                    xAxis: {
                        labels: { enabled: false },
                        tickPositions: []
                    },
                    yAxis: [{
                        title: {
                            text: null
                        },
                        min: 0,
                        labels: { enabled: false }
                    }],
                    title: { text: null },
                    plotOptions: {
                        series: {
                            marker: {
                                enabled: false
                            }
                        },
                        area: {
                            stacking: 'normal'
                        }
                    }
                },
                chartData: this._getChartData()
            });
        },
        
        _getChartData: function() {
            var categories = _.range(1, this.totalDays + 1);
            var dataByState = _.reduce(this.scheduleStateValues, function(result, scheduleState) {
                result[scheduleState] = {name: scheduleState, data: []};
                return result;
            }, {});
            
            _.each(categories, function(x, day) {
                var snapshotData = this.allSnapshotData[day];
                var points = _.reduce(this.scheduleStateValues, function(result, scheduleState) {
                    result[scheduleState] = 0;
                    return result;
                }, {});
                
                if(day <= this.day) {
                    _.each(snapshotData, function(snapshot) {
                        var estimate = snapshot.get('PlanEstimate') || 0,
                            state = snapshot.get('ScheduleState');
                         points[state] += estimate;
                    });
                }
                
                _.each(this.scheduleStateValues, function(state) {
                    dataByState[state].data[day] = points[state];  
                });
            }, this);
            
            return {
                categories: categories,
                series: _.values(dataByState)
            };
        }
    });
})();