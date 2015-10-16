(function() {
    var Ext = window.Ext4 || window.Ext;

    /**
     * Allows user to see stats for a timebox in a horizontal bar format
     */
    Ext.define('StatsBanner', {
        extend: 'Ext.Container',
        alias:'widget.statsbanner',
        requires: 'PlannedVelocity',
        cls: 'stats-banner',
        layout: 'hbox',
        border: 0,
        width: '100%',

        config: {
            context: null,
            snapshotData: [],
            iterations: [],
            day: 0,
            totalDays: 0
        },

        items: [
            {xtype: 'statsbannerplannedvelocity'},
            {xtype: 'statsbannertimeboxend'},
            {xtype: 'statsbanneraccepted'},
            {xtype: 'statsbannerdefects'}
        ],


        initComponent: function() {
            //need to configure the items at the instance level, not the class level (i.e. don't use the 'defaults' config)
            this.items = this._configureItems(this.items);

            this.callParent(arguments);
        },

        _getItemDefaults: function() {
            return {
                flex: 1,
                context: this.context,
                snapshotData: this.snapshotData,
                iterations: this.iterations,
                day: this.day,
                totalDays: this.totalDays
            };
        },

        _configureItems: function(items) {
            var defaults = this._getItemDefaults();

            return _.map(items, function(item) {
                return _.defaults(_.cloneDeep(item), defaults);
            });
        }
    });
})();