odoo.define('pos_loyalty_odoo.LoyaltyPopupWidget', function(require){
	'use strict';

	const { useExternalListener } = owl.hooks;
	const PosComponent = require('point_of_sale.PosComponent');
	const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
	const Registries = require('point_of_sale.Registries');
	const { useListener } = require('web.custom_hooks');
	const { useState } = owl.hooks;
	let redeem;
	

	class LoyaltyPopupWidget extends AbstractAwaitablePopup {

		constructor() {
			super(...arguments);
			this.calculate_loyalty_points();
		}

		calculate_loyalty_points(){
			let self = this;
			let order = this.env.pos.get_order();
			let orderlines = order.get_orderlines();
			let partner = this.props.partner;
			let loyalty_settings = this.env.pos.pos_loyalty_setting;
			
			self.partner = partner || {};
			self.loyalty = partner.loyalty_points1;
			if(loyalty_settings.length != 0)
			{

				let product_id = loyalty_settings[0].product_id[0];
				let product = this.env.pos.db.get_product_by_id(product_id);
				self.product = product;

				if(loyalty_settings[0].redeem_ids.length != 0)
				{
					let redeem_arr = []
					for (let i = 0; i < loyalty_settings[0].redeem_ids.length; i++) {
						for (let j = 0; j < this.env.pos.pos_redeem_rule.length; j++) {
							if(loyalty_settings[0].redeem_ids[i] == this.env.pos.pos_redeem_rule[j].id)
							{
								redeem_arr.push(this.env.pos.pos_redeem_rule[j]);
							}
						}
					}

					for (let j = 0; j < redeem_arr.length; j++) {
						if( redeem_arr[j].min_amt <= partner.loyalty_points1 && partner.loyalty_points1 <= redeem_arr[j].max_amt)
						{
							redeem = redeem_arr[j];
							break;
						}
					}
					if(redeem)
					{
						let point_value = redeem.reward_amt * self.loyalty;
						if (partner){
							self.loyalty_amount = point_value;
							partner.loyalty_amount = point_value;
						}
					}
					
				}
			}
		}

		redeemPoints() {
			let self = this;
			let order = this.env.pos.get_order();
			let orderlines = order.orderlines;
			let entered_code = $("#entered_item_qty").val();
			let point_value = 0;
			let remove_line;	
			let partner = this.props.partner;
			let loyalty = partner.loyalty_points1;

			if(redeem.min_amt <= loyalty &&  loyalty<= redeem.max_amt)
			{
				if(entered_code <= loyalty)
				{
					let total = order.get_total_with_tax();
					let redeem_value = redeem.reward_amt * entered_code
					if (redeem_value > total) {
						alert('Please enter valid amountss.')
					}
					if (redeem_value <= total) {
						order.add_product(self.product, {
							price: -redeem_value
						});

						partner.loyalty_points1 -= entered_code;
						remove_line = orderlines.models[orderlines.length-1].id
						order.redeemed_points = entered_code;
						order.set('redeem_done', true);
						order.set("redeem_point",entered_code);
						order.set('remove_line', remove_line);
						self.trigger('close-popup')
						self.showScreen('ProductScreen');
					}
				}
				else{
					alert('Please enter valid amount.');
				}
			}
			else{
				alert("limit exceeded");
			}	
			          
		}
	};
	
	LoyaltyPopupWidget.template = 'LoyaltyPopupWidget';

	Registries.Component.add(LoyaltyPopupWidget);

	return LoyaltyPopupWidget;

});