(function() {
    var Ext = window.Ext4 || window.Ext;

    /**
     * shows days remaining for timebox
     */
    Ext.define('TimeboxEnd', {
        extend: 'Gauge',
        alias:'widget.statsbannertimeboxend',
        requires: [
            'Rally.util.Timebox',
            'Rally.util.Colors'
        ],

        tpl: [
            '<div class="expanded-widget">',
            '<div class="stat-title">{type} End</div>',
            '<div class="stat-metric">',
            '<div class="metric-chart"></div>',
            '<div class="metric-chart-text">',
            '{remaining}',
            '</div>',
            '<div class="metric-subtext">days left of {workdays}</div>',
            '</div>',
            '</div>',
            '<div class="collapsed-widget">',
            '<div class="stat-title">{type} End</div>',
            '<div class="stat-metric">{remaining}<span class="stat-metric-secondary"> days</span></div>',
            '</div>'
        ],

        config: {
            data: {
                type: 'Iteration',
                remaining: 0,
                workdays: 0
            }
        },

        getChartEl: function() {
            return this.getEl().down('.metric-chart');
        },

        _getRenderData: function() {
            return {
                type: Ext.String.capitalize(this.getContext().getTimeboxScope().getType()),
                remaining: this.totalDays - this.day - 1,
                workdays: this.totalDays
            };
        },

        onRender: function () {
            this.callParent(arguments);
            var renderData = this._getRenderData(); 
            this.update(renderData);

            this.refreshChart(this._getChartConfig(renderData));
        },

        _getChartConfig: function (renderData) {
            var decimal = renderData.remaining / renderData.workdays,
                percentLeft = decimal < 1 ? Math.round(decimal * 100) : 0,
                color = Rally.util.Colors.cyan;

            if (renderData.total === 0) {
                color = Rally.util.Colors.grey1;
            } else if (percentLeft === 0) {
                color = renderData.accepted === renderData.total ? Rally.util.Colors.lime : Rally.util.Colors.blue;
            } else if (percentLeft <= 25) {
                color = Rally.util.Colors.blue;
            }

            return {
                chartData: {
                    series: [{
                        data: [
                            {
                                name: 'Days Done',
                                y: 100 - percentLeft,
                                color: color
                            },
                            {
                                name: 'Days Left',
                                y: percentLeft,
                                color: Rally.util.Colors.grey1
                            }
                        ]
                    }]
                }
            };
        }
    });
})();