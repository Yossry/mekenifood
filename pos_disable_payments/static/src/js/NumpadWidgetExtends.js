
odoo.define('pos_disable_payments.NumpadWidgetExtends', function(require) {
    'use strict';

    const NumpadWidget = require('point_of_sale.NumpadWidget');
    const Registries = require('point_of_sale.Registries');

    const NumpadWidgetextend = NumpadWidget => class extends NumpadWidget {
        sendInput(key) {
            let cashier = this.env.pos.get_cashier();
            if(this.props.activeMode == 'quantity'){
                 if('is_allow_qty' in cashier){
                     if (cashier.is_allow_qty) {
                         this.trigger('numpad-click-input', { key });
                     }
                     else{
                         alert("Sorry,You have no access to change quantity");
                     }
                 }
                 else{
                    this.trigger('numpad-click-input', { key });
                 }  
            }else if(this.props.activeMode == 'price'){
                 if('is_edit_price' in cashier){
                     if (cashier.is_edit_price) {
                         this.trigger('numpad-click-input', { key });
                     }
                     else{
                         alert("Sorry,You have no access to change Price");
                     }
                 }
                 else{
                    this.trigger('numpad-click-input', { key });
                 } 
            }else if(this.props.activeMode == 'discount'){
                 if('is_allow_discount' in cashier){
                     if (cashier.is_allow_discount) {
                         this.trigger('numpad-click-input', { key });
                     }
                     else{
                         alert("Sorry,You have no access to change discount");
                     }
                 }
                 else{
                    this.trigger('numpad-click-input', { key });
                 } 
            }
        }
    };

    Registries.Component.extend(NumpadWidget, NumpadWidgetextend);

    return NumpadWidget;
 });