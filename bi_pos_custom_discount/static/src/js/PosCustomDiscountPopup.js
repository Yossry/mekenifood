
odoo.define('bi_pos_custom_discount.PosCustomDiscountPopup', function(require){
	'use strict';

	const Popup = require('point_of_sale.ConfirmPopup');
	const Registries = require('point_of_sale.Registries');
	const PosComponent = require('point_of_sale.PosComponent');

	class PosCustomDiscountPopup extends Popup {

		constructor() {
            super(...arguments);

            this.options = {};
        }

		go_back_screen() {
			this.showScreen('ProductScreen');
			this.trigger('close-popup');
		}

		click_on_discount(event) {
			var self = this;
			var custom_discount = this.props.discounts;
			var discount_id = $(event.currentTarget).attr('id');
			var selectedDiscount = null;
			for(var i = 0, len = Math.min(custom_discount.length,1000); i < len; i++) {
				if (custom_discount[i] && custom_discount[i].id == discount_id) {
					selectedDiscount = custom_discount[i].discount;
				}
			}
			
			
			var order = self.env.pos.get_order();
			var orderlines = order.orderlines;
			if (orderlines.length === 0) {
				self.showPopup('ErrorPopup',{
					'title': self.env._t('Empty Order'),
					'body': self.env._t('There must be at least one product in your order before applying discount.'),
				});
				return;
			}
			else{
				var selectedOrderLine = order.get_selected_orderline()
				selectedOrderLine.set_discount(selectedDiscount);
				self.trigger('close-popup');
			}               
		}

		
        
	};
	
	PosCustomDiscountPopup.template = 'PosCustomDiscountPopup';

	Registries.Component.add(PosCustomDiscountPopup);

	return PosCustomDiscountPopup;

});