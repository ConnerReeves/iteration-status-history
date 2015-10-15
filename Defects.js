(function() {
    var Ext = window.Ext4 || window.Ext;

    /**
     * shows defects active for timebox
     */
    Ext.define('Defects', {
        extend: 'Ext.Component',
        alias:'widget.statsbannerdefects',
        requires: [],

        config: {
            context: null,
            store: null,
            data: {
                activeCount: 0
            }
        },

        tpl: [
            '<div class="expanded-widget">',
            '<div class="stat-title">Defects</div>',
            '<div class="stat-metric">',
            '<div class="metric-icon icon-defect"></div>{activeCount}',
            '<div class="stat-secondary">Active</div>',
            '</div>',
            '</div>',
            '<div class="collapsed-widget">',
            '<span class="metric-icon icon-defect"></span>',
            '<div class="stat-title">Defects</div>',
            '<div class="stat-metric">{activeCount}</div>',
            '</div>'
        ],

        cls: 'stat-panel',

        onRender: function() {
            this.callParent(arguments);
            this.update(this._getRenderData());
        },

        _getActiveDefectCount: function() {
            var activeDefects = 0;
            _.each(this.snapshotData, function(record) {
                if(Rally.util.Ref.getTypeFromRef(record) === 'defect') {
                    activeDefects++;
                }
            }, this);
            return activeDefects;
        },

        _getRenderData: function() {
            return {activeCount: this._getActiveDefectCount()};
        }
    });
})();