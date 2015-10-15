Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
      this.add([{
        xtype: 'rallyiterationcombobox',
        id: 'iteration-picker',
        listeners: {
          change: this._onIterationChange,
          scope: this
        }
      }]);
    },

    _onIterationChange: function(picker) {
      var iterationName = picker.getRawValue();

      this._getIterationOIDs(iterationName)
        .then(this._getSnapshotData.bind(this));
    },

    _getIterationOIDs: function(iterationName) {
      var promise = Ext.create('Deft.Deferred');

      Ext.create('Rally.data.wsapi.Store', {
        autoLoad: true,
        limit: Infinity,
        fetch: ['StartDate', 'EndDate', 'ObjectID'],
        model: 'Iteration',
        filters: [{
          property: 'Name',
          value: iterationName
        }],
        listeners: {
          load: function(store, data) {
            if (data.length) {
              promise.resolve(_.map(data, function(record) {
                return record.get('ObjectID');
              }));
            }
          }
        }
      });

      return promise;
    },

    _getSnapshotData: function(iterationOIDs) {
      var picker = Ext.getCmp('iteration-picker');
      var iteration = picker.getRecord();
      var startDate = iteration.get('StartDate');
      var endDate = iteration.get('EndDate');
      var dateSeries = this._getDateSeries(startDate, endDate);

      Deft.Chain.parallel(_.map(dateSeries, function(date) {
        return function() {
          var promise = Ext.create('Deft.Deferred');

          Ext.create('Rally.data.lookback.SnapshotStore', {
            autoLoad: true,
            fetch: ['Name', 'ScheduleState', 'FormattedID', 'PlanEstimate', 'Owner', 'Blocked', 'Ready', 'BlockedReason'],
            filters: [{
              property: '__At',
              value: Rally.util.DateTime.toIsoString(date)
            },{
              property: '_TypeHierarchy',
              operator: 'in',
              value: ['Defect', 'HierarchicalRequirement', 'TestSet', 'DefectSuite']
            },{
              property: 'Iteration',
              operator: 'in',
              value: iterationOIDs
            }],
            listeners: {
              load: function(store, snapshots) {
                promise.resolve(snapshots);
              }
            }
          });

          return promise;
        };
      })).then(function(snapshotData) {
        debugger;
      });

    },

    _getDateSeries: function(startDate, endDate) {
      var dates = [];
      var date = startDate;
      date.setHours(23, 59, 59);

      while(date < endDate) {
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          dates.push(date);
        }
        date = new Date(date.getTime() + (1000 * 60 * 60 * 24));
      }

      return dates;
    }
});
