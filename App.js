Ext.define('IterationStatusHistory', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'iteration',
    layout: {
      type: 'vbox',
      align: 'stretch'
    },

    launch: function() {
      this.callParent(arguments);
      this.add({
        flex: 1,
        xtype: 'container',
        layout: {
          type: 'vbox',
          align: 'stretch'
        },
        items: [
          {
            xtype: 'container',
            items: [{
              xtype: 'rallybutton',
              iconCls: 'icon-right',
              width: 27,
              cls: 'rly-small secondary',
              listeners: {
                click: this._play,
                scope: this
              }
            }]
          },
        {
          xtype: 'container',
          itemId: 'chartContainer',
          height: 110
        }, {
          xtype: 'container',
          itemId: 'boardContainer',
          flex: 1
        }]
      });
    },

    onScopeChange: function() {
      var iterationName = this.getContext().getTimeboxScope()
        .getRecord().get('Name');

      this._getIterationOIDs(iterationName)
        .then(this._getSnapshotData.bind(this));
    },

    _getIterationOIDs: function(iterationName) {
      var promise = Ext.create('Deft.Deferred');

      Ext.create('Rally.data.wsapi.Store', {
        autoLoad: true,
        limit: Infinity,
        fetch: ['StartDate', 'EndDate', 'ObjectID', 'PlannedVelocity'],
        model: 'Iteration',
        filters: [{
          property: 'Name',
          value: iterationName
        }],
        listeners: {
          load: function(store, data) {
            promise.resolve(data);
          }
        }
      });

      return promise;
    },

    _getSnapshotData: function(iterationRecords) {
      this.iterations = iterationRecords;
      var iteration = this.getContext().getTimeboxScope().getRecord();
      var startDate = iteration.get('StartDate');
      var endDate = iteration.get('EndDate');
      var dateSeries = this._getDateSeries(startDate, endDate);
      var iterationOIDs = _.map(iterationRecords, function(iterationRecord) {
        return iterationRecord.getId();
      });

      Deft.Chain.parallel(_.map(dateSeries, function(date) {
        return function() {
          var promise = Ext.create('Deft.Deferred');

          Ext.create('Rally.data.lookback.SnapshotStore', {
            autoLoad: true,
            fetch: ['Name', 'ScheduleState', 'FormattedID', 'PlanEstimate', 'Owner', 'Blocked', 'Ready', 'BlockedReason'],
            hydrate: ['ScheduleState', 'State'],
            filters: [{
              property: '__At',
              value: Rally.util.DateTime.toIsoString(date)
            },{
              property: '_TypeHierarchy',
              operator: 'in',
              value: ['Defect', 'HierarchicalRequirement', 'TestSet', 'DefectSuite', 'Task']
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
      })).then((function(snapshotData) {
        this.snapshotData = snapshotData;
        console.log(snapshotData);
        this._showData(0);
      }).bind(this));
    },

    _getDateSeries: function(startDate, endDate) {
      var dates = [];
      var date = startDate;
      date.setHours(23, 59, 59);

      while(date <= endDate) {
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          dates.push(date);
        }
        date = new Date(date.getTime() + (1000 * 60 * 60 * 24));
      }

      return dates;
    },

    _play: function() {
      var index = 0;
      this.interval = setInterval((function() {
        this._showData(index);
        index++;
      }).bind(this), 3000);
    },

    _showData: function(index) {
      var snapshotData = this.snapshotData[index];
      if(snapshotData) {
        this._showCharts(snapshotData, index);
        this._showBoard(snapshotData);
      } else {
        clearInterval(this.interval);
        delete this.interval;
      }
    },

    _showCharts: function(data, index) {
      if(this.down('statsbanner')) {
        this.down('statsbanner').destroy();
      }
      this.down('#chartContainer').add({
        xtype: 'statsbanner',
        context: this.getContext(),
        iterations: this.iterations,
        snapshotData: data,
        day: index,
        totalDays: this.snapshotData.length
      });
    },

    _showBoard: function(data) {

    }
});
