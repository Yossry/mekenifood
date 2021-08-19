odoo.define('pos_custom_discount.pos', function(require) {
	"use strict";

	var models = require('point_of_sale.models');
	// var screens = require('point_of_sale.screens');
	var core = require('web.core');
	// var gui = require('point_of_sale.gui');
	// var popups = require('point_of_sale.popups');

	var _t = core._t;
	
	models.load_models({
		model: 'pos.custom.discount',
		fields: ['name','discount','description','available_pos_ids'],
		domain: function(self) {
			return [
				['id', 'in', self.config.custom_discount_ids]
			];
		},
		loaded: function(self, pos_custom_discount) {
			
			self.pos_custom_discount = pos_custom_discount;
		},

	});
	
	models.load_models({
		model: 'pos.config',
		fields: ['allow_custom_discount','custom_discount_ids'],
		domain: null,
		loaded: function(self, pos_custom_config) {
			self.pos_custom_config = pos_custom_config;
		},

	});
	
	
	
	var OrderlineSuper = models.Orderline;
	models.Orderline = models.Orderline.extend({
	initialize: function(attr,options){
	OrderlineSuper.prototype.initialize.apply(this, arguments);
		this.pos   = options.pos;
		this.order = options.order;
		this.custom_discounts = options.discounts
		
		if (options.json) {
			this.init_from_JSON(options.json);
			return;
		}


	},
	clone: function(){
		var orderline = new exports.Orderline({},{
			pos: this.pos,
			order: null,
			product: this.product,
			price: this.price,
		});
		
		orderline.quantity = this.quantity;
		orderline.quantityStr = this.quantityStr;
		orderline.discount = this.discount;
		orderline.type = this.type;
		orderline.selected = false;
		return orderline;
	},
	

 });

});
