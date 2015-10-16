(function() {
    var Ext = window.Ext4 || window.Ext;

    /**
     * shows burndown for timebox
     */
    Ext.define('IterationProgress', {
        extend: 'Ext.Component',
        alias:'widget.statsbanneriterationprogress',
        requires: [
            'Rally.ui.carousel.Carousel',
            'CumulativeFlowChart'
        ],

        config: {
            context: null,
            store: null,
            data: {}
        },
        
        cls: 'stat-panel',

        currentChartDisplayed: 0,

        tpl: [
            '<div class="expanded-widget">',
            '<div class="stat-title"></div>',
            '<div class="stat-metric">',
            '<div class="stat-carousel"></div>',
            '</div>',
            '</div>',
            '<div class="collapsed-widget">',
            '<span class="metric-icon icon-pie"></span>',
            '<div class="stat-title"></div>',
            '</div>'
        ],

        initComponent: function(){
            this.callParent(arguments);
          
            this.carouselItems = [
                // {
                //     xtype: 'statsbannerburndownchart',
                //     width: 150,
                //     height: 63,
                //     minimalMode: true,
                //     context: this.context,
                //     store: this.store
                // },
                {
                    xtype: 'statsbannercumulativeflowchart',
                    width: 150,
                    height: 63,
                    minimalMode: true,
                    context: this.context,
                    allSnapshotData: this.allSnapshotData,
                    scheduleStateValues: this.scheduleStateValues,
                    totalDays: this.totalDays
                }
            ];
        },

        _cleanupCarousel: function () {
            if (this.carousel) {
                this.carousel.destroy();
                delete this.carousel;
            }
        },

        onDestroy: function () {
            this._cleanupCarousel();
            this.callParent(arguments);
        },

        afterRender: function() {
            this.callParent(arguments);
            if (!this.getContext().getTimeboxScope().getRecord()) {
                this._addPlaceholder();
            } else {
                this.createCarousel();
            }
        },

        createCarousel: function() {
            this.carousel = Ext.create('Rally.ui.carousel.Carousel', {
                showHeader: false,
                showDots: true,
                smallDots: true,
                renderTo: this.getEl().down('.stat-carousel'),
                height: 75,
                layout: {
                    type: 'vbox',
                    align: 'center'
                },
                listeners: {
                    currentitemset: this._updateTitle,
                    carouselmove: this._updateTitle,
                    scope: this
                },
                carouselItems: this.carouselItems
            });

            if (!Ext.isIE8m){
                // if such next line runs IE8 or < goes boom! WOW!
                this.carousel.setCurrentItem(this.currentChartDisplayed);
            }

            // this.carousel.on('carouselmove', this._chartShownChanged, this);
        },

        _updateTitle: function(carousel){
            _.each(this.getEl().query('.stat-title'), function(el){
                Ext.fly(el).update(carousel.getCurrentItem().displayTitle);
            }, this);
        },

        // _chartShownChanged: function(){
        //     var chartShown = _.findIndex(this.carouselItems, {xtype: this.carousel.getCurrentItem().xtype});
        //     this.currentChartDisplayed = chartShown || 0;
        //     this.saveState();
        // },

        _addPlaceholder: function() {
            this.update();

            if (this.expanded) {
                this.carousel = Ext.create('Ext.Container', {
                    renderTo: this.getEl().down('.stat-carousel'),
                    html: 'no iteration data'
                });
            }
        }
    });
})();