(function() {
    var Ext = window.Ext4 || window.Ext;

    /**
     * shows completed tasks for timebox
     */
    Ext.define('Tasks', {
        extend: 'Ext.Component',
        alias:'widget.statsbannertasks',
        requires: [],

        config: {
            context: null,
            store: null,
            data: {
                count: 0
            }
        },

        tpl: [
            '<div class="expanded-widget">',
            '<div class="stat-title">Tasks</div>',
            '<div class="stat-metric">',
            '<span class="metric-icon icon-task"></span>{count}',
            '<div class="stat-secondary">Active</div>',
            '</div>',
            '</div>',
            '<div class="collapsed-widget">',
            '<span class="metric-icon icon-task"></span>',
            '<div class="stat-title">Tasks</div>',
            '<div class="stat-metric">{count}</div>',
            '</div>'
        ],
        
        cls: "stat-panel",

        onRender: function(){
          this.callParent(arguments);
          this.update(this._getRenderData());  
        },

        _getRenderData: function() {
            return {count: this._getTaskCount()};
        },

        _getTaskCount: function() {
            var taskCount = 0;
            _.each(this._snapshotData, function(record){
                if(Rally.util.Ref.getTypeFromRef(record) === 'task') {
                   var taskSummary = record.get('Summary') && record.get('Summary').Tasks;
                    if (taskSummary) {
                        _.each(taskSummary['state+blocked'], function(count, state) {
                            if (!Ext.String.startsWith(state, 'Completed')) {
                                taskCount += count;
                            }
                        }, this);
                    } 
                }
                
            }, this);
            return taskCount;
        }
    });
})();