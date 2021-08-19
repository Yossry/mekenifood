
odoo.define('bi_pos_custom_discount.NumpadWidgetextend', function(require) {
    'use strict';

    const NumpadWidget = require('point_of_sale.NumpadWidget');
    const Registries = require('point_of_sale.Registries');

    const NumpadWidgetextend = NumpadWidget => class extends NumpadWidget {
        changeMode(mode) {
            var self = this;
			var discounts = self.env.pos.pos_custom_discount;
			var mode = mode;
			if (mode == 'discount') {
				if (self.env.pos.config.allow_custom_discount) {
					self.showPopup('PosCustomDiscountPopup', {'discounts': discounts});
				} 
			}
			super.changeMode();
        }
    };

    Registries.Component.extend(NumpadWidget, NumpadWidgetextend);

    return NumpadWidget;
 });
