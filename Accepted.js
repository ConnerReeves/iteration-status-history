(function() {
    var Ext = window.Ext4 || window.Ext;

    /**
     * shows accepted work units for timebox
     */
    Ext.define('Accepted', {
        extend: 'Gauge',
        alias:'widget.statsbanneraccepted',
        requires: ['Rally.util.Colors'],

        tpl: [
            '<div class="expanded-widget">',
            '<div class="stat-title">Accepted Stories</div>',
            '<div class="stat-metric">',
            '<div class="metric-chart"></div>',
            '<div class="metric-chart-text percent-offset">',
            '{percentage}<div class="metric-percent">%</div>',
            '</div>',
            '<div class="metric-subtext">{accepted} of {total} {unit}</div>',
            '</div>',
            '</div>',
            '<div class="collapsed-widget">',
            '<div class="stat-title">Accepted Stories</div>',
            '<div class="stat-metric">{percentage}<span class="metric-percent">%</span></div>',
            '</div>'
        ],

        config: {
            data: {
                percentage: 0,
                accepted: 0,
                total: 0,
                unit: ''
            }
        },

        getChartEl: function() {
            return this.getEl().down('.metric-chart');
        },

        _getTimeboxUnits: function() {
            return this.getContext().getTimeboxScope().getType() === 'iteration' ?
                    this.getContext().getWorkspace().WorkspaceConfiguration.IterationEstimateUnitName :
                    this.getContext().getWorkspace().WorkspaceConfiguration.ReleaseEstimateUnitName;
        },

        onRender: function () {
            this.callParent(arguments);
            var renderData = this._getRenderData(); 
            this.update(renderData);

            this.refreshChart(this._getChartConfig(renderData));
        },


        _getRenderData: function() {
            var data = {
                unit: this._getTimeboxUnits(),
                remaining: this.totalDays - this.day,
                workdays: this.totalDays
            };
            var accepted = 0;
            var total = 0;
            
            _.each(this.snapshotData, function(snapshot) {
                total += snapshot.get('PlanEstimate');
                if(_.contains(['Accepted', 'Released'], snapshot.get('ScheduleState'))) {
                    accepted += snapshot.get('PlanEstimate');
                }
            });

            data.accepted = Ext.util.Format.round(accepted, 2);
            data.total = Ext.util.Format.round(total, 2);
           
            data.percentage = Math.round((data.accepted / data.total) * 100) || 0;

            return data;
        },

        _getChartConfig: function(renderData) {
            var color = Rally.util.Colors.cyan,
                daysRemaining = renderData.remaining / renderData.workdays,
                percentage = renderData.percentage;

            if (percentage === 100) {
                color = Rally.util.Colors.lime;
            } else if (daysRemaining === 0) {
                color = Rally.util.Colors.blue;
            }

            return {
                chartData: {
                    series: [{
                        data: [
                            {
                                name: 'Accepted Stories',
                                y: percentage,
                                color: color
                            },
                            {
                                name: '',
                                y: 100 - percentage,
                                color: Rally.util.Colors.grey1
                            }
                        ]
                    }]
                }
            };
        }
    });
})();