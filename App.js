Ext.define('IterationStatusHistory', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'iteration',
    layout: {
      type: 'vbox',
      align: 'stretch'
    },

    snapshotIndex: 0,

    launch: function() {
      this.callParent(arguments);
      this.add({
        flex: 1,
        xtype: 'container',
        layout: {
          type: 'vbox',
          align: 'stretch'
        },
        items: [{
          xtype: 'container',
          width: 600,
          items: [{
            xtype: 'rallybutton',
            iconCls: 'icon-right',
            width: 32,
            margin: '10 0 10 10',
            cls: 'rly-small secondary',
            listeners: {
              click: this._play,
              scope: this
            }
          },{
            xtype: 'rallybutton',
            iconCls: 'icon-pause',
            width: 32,
            margin: '10 0 10 10',
            cls: 'rly-small secondary',
            listeners: {
              click: this._pause,
              scope: this
            }
          },{
            xtype: 'container',
            margin: '10',
            id: 'date-display'
          }]
        }, {
          xtype: 'container',
          itemId: 'chartContainer',
          height: 110
        }, {
          xtype: 'container',
          id: 'board-container',
          flex: 1,
          layout: 'fit',
          margin: '20px 0 0 0',
          items: [{
            xtype: 'rallycardboard',
            id: 'card-board',
            attribute : 'ScheduleState',
            types: ['Defect', 'HierarchicalRequirement', 'TestSet', 'DefectSuite'],
            storeConfig : {
              autoLoad: false
            },
            columnConfig: {
              isMatchingRecord: function(record) {
                return record.get(this.attribute) === this.getValue();
              }
            },
            cardConfig: {
              fields: ['PlanEstimate']
            },
            rowConfig: {
              field: 'Expedite'
            }
          }]
        }]
      });
    },

    onScopeChange: function() {
      var iterationName = this.getContext().getTimeboxScope()
        .getRecord().get('Name');

      Deft.Promise.all([
        this._getIterationOIDs(iterationName),
        this._loadScheduleStateValues()
        ]).then({
          success: function(results) {
            this._getSnapshotData(results[0]);
          },
          scope: this
        });
    },

   _loadScheduleStateValues: function () {
      return Rally.data.ModelFactory.getModel({
          type: 'UserStory',
          success: function (model) {
              model.getField('ScheduleState').getAllowedValueStore().load({
                  callback: function (records) {
                      this.scheduleStateValues = _.invoke(records, 'get', 'StringValue');
                  },
                  scope: this
              });
          },
          scope: this
      });
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
      this.dateSeries = this._getDateSeries(startDate, endDate);
      var iterationOIDs = _.map(iterationRecords, function(iterationRecord) {
        return iterationRecord.getId();
      });

      Deft.Chain.parallel(_.map(this.dateSeries, function(date) {
        return function() {
          var promise = Ext.create('Deft.Deferred');

          Ext.create('Rally.data.lookback.SnapshotStore', {
            autoLoad: true,
            fetch: ['_TypeHierarchy', 'DisplayColor', 'Name', 'ScheduleState', 'FormattedID', 'PlanEstimate', 'Owner', 'Blocked', 'Ready', 'BlockedReason', 'State', 'Expedite'],
            hydrate: ['ScheduleState', '_TypeHierarchy', 'Owner', 'State'],
            limit: Infinity,
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
            sorters: [{
              property: 'ObjectID',
              direction: 'ASC'
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
        var userOIDs = _.unique(_.compact(_.flatten(_.map(snapshotData, function(snapshots) {
          return _.map(snapshots, function(snapshot) {
            return snapshot.get('Owner');
          });
        }))));

        this._getUserNameMap(userOIDs).then((function(userNameMap) {
          _.each(snapshotData, function(snapshots) {
            _.each(snapshots, function(snapshot) {
              snapshot.set('_id', snapshot.get('ObjectID'));
              snapshot.set('_ref', '/' + _.last(snapshot.get('_TypeHierarchy')).toLowerCase() + '/' + snapshot.get('ObjectID'));
              if (snapshot.get('Owner')) {
                snapshot.set('Owner', {
                  _ref: '/user/' + snapshot.get('Owner'),
                  _refObjectName: userNameMap[snapshot.get('Owner')]
                });
              }
            });
          });

          this.snapshotData = snapshotData;
          this._showData(0);
        }).bind(this));
      }).bind(this));
    },

    _getUserNameMap: function(userOIDs) {
      var promise = Ext.create('Deft.Deferred');

      Ext.create('Rally.data.wsapi.Store', {
        autoLoad: true,
        limit: Infinity,
        model: 'User',
        fetch: ['DisplayName'],
        filters: Rally.data.QueryFilter.or(_.map(userOIDs, function(OID) {
          return {
            property: 'ObjectID',
            value: OID
          };
        })),
        listeners: {
          load: function(store, data) {
            var userNameMap = _.reduce(data, function(map, user) {
              map[user.get('ObjectID')] = user.get('_refObjectName');

              return map;
            }, {});

            promise.resolve(userNameMap);
          }
        }
      });

      return promise;
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
      if (this.snapshotIndex >= this.snapshotData.length) {
        this.snapshotIndex = 0;
      } else {
        this.snapshotIndex++;
      }

      this._showData(this.snapshotIndex);
      this.interval = setInterval((function() {
        this.snapshotIndex++;
        this._showData(this.snapshotIndex);
      }).bind(this), 3000);
    },

    _pause: function() {
      clearInterval(this.interval);
      delete this.interval;
    },

    _showData: function(index) {
      var snapshotData = this.snapshotData[index];
      if(snapshotData) {
        this._displayCurrentDate(this.dateSeries[index]);
        this._showCharts(snapshotData, index);
        this._showBoard(snapshotData, index !== 0);
      } else {
        this._pause();
      }
    },

    _displayCurrentDate: function(date) {
      var dateContainer = Ext.getCmp('date-display');
      var formattedDate = Rally.util.DateTime.format(date, 'l, M dd, Y');
      dateContainer.update(formattedDate);
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
        totalDays: this.snapshotData.length,
        allSnapshotData: this.snapshotData,
        scheduleStateValues: this.scheduleStateValues
      });
    },

    _showBoard: function(data, flair) {
      var board = Ext.getCmp('card-board');
      var columnNames = _.pluck(board.columnDefinitions, 'value');
      var existingCardOIDs = _.map(board.columnDefinitions, function() {
        return [];
      });

      _.each(board.columnDefinitions, function(column, idx) {
        existingCardOIDs[idx] = _.map(column.getCards(), function(card) {
          return card.getRecord().get('ObjectID');
        });
        column.clearCards();
      });

      _.each(data, function(record) {
        var newCardIndex = columnNames.indexOf(record.get(board.attribute));
        board.addCard(record, flair && !_.contains(existingCardOIDs[newCardIndex], record.get('ObjectID')));
      });
    }
});
