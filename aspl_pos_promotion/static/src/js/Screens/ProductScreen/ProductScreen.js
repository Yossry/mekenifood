odoo.define('aspl_pos_promotion.ProductScreen', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const NumberBuffer = require('point_of_sale.NumberBuffer');
    const { Gui } = require('point_of_sale.Gui');
    const { useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    const { useRef, useState } = owl.hooks;

    const PromotionProductScreenInh = (ProductScreen) =>
        class extends ProductScreen {
            async _updateSelectedOrderline(event) {
                var selectedLine = this.currentOrder.get_selected_orderline();
                if(!this.currentOrder.is_empty() && this.currentOrder.get_order_total_discount_line() || (selectedLine && selectedLine.get_promotion())){
                    let promotion = selectedLine.get_promotion();
                    if(promotion.promotion_type == 'discount_total'){
                        return false;
                    }
                }
                    super._updateSelectedOrderline(event);

            }
            async _setValue(val){
                var selectedLine = this.currentOrder.get_selected_orderline();
                var _lines = this.currentOrder.get_orderlines();

                if(this.currentOrder.is_empty() || selectedLine.get_unique_child_id()){
                    return;
                }

                if(val === 'remove' || !val){
                    if(selectedLine && selectedLine.get_promotion()){
                        var promotion = selectedLine.get_promotion();
                        const { confirmed } = await this.showPopup('ConfirmPopup', {
                                title: this.env._t('Contain'+ promotion.promotion_code + 'Promotion'),
                                body: 'Are you sure you want to remove this line?',
                            });
                        if (!confirmed)
                            return;
                        if (_.contains(['quantity_discount', 'quantity_price', 'discount_on_multi_category'], promotion.promotion_type)) {
                            selectedLine.set_quantity(val);
                            selectedLine.set_unit_price(val);
                            selectedLine.set_discount(0);
                            selectedLine.set_promotion(false);
                        }else if(promotion.promotion_type == 'discount_on_multi_product'){
                            const combinationId = selectedLine.get_combination_id();
                            selectedLine.set_quantity(val);
                            selectedLine.set_unit_price(val);
                            _.each(_lines, function(line){
                                if(line.get_combination_id() === combinationId){
                                    line.set_discount(0);
                                    line.set_combination_id();
                                    line.set_promotion(false);
                                }
                            })
                            super._setValue(val);
                        }else if(promotion.promotion_type === 'buy_x_get_dis_y'){
                            selectedLine.set_promotion(null);
                            selectedLine.set_promotion_disc_child_id(null)
                            selectedLine.set_discount(0)
                            super._setValue(val);
//                            this.currentOrder.apply_pos_promotion();
                            this.currentOrder.apply_pos_order_discount_total();
                        }
                    }else if(selectedLine && selectedLine.get_unique_parent_id()){
                        super._setValue(val);
                        var childLine = this.currentOrder.get_orderline_by_unique_id(selectedLine.get_unique_parent_id());
                        this.currentOrder.remove_orderline(childLine);
                        selectedLine.set_unique_parent_id(false)
//                        this.currentOrder.apply_pos_promotion();
                        this.currentOrder.apply_pos_order_discount_total();
                    }else if(selectedLine && selectedLine.get_promotion_disc_parent_id()){
                        for(var _line of _lines){
                            if(selectedLine.get_promotion_disc_parent_id() == _line.get_promotion_disc_child_id()){
                                _line.set_promotion(false);
                                _line.set_promotion_disc_child_id(null);
                                _line.set_discount(0)
                            }
                        }
                        selectedLine.set_promotion_disc_parent_id(null)
                        super._setValue(val);
//                        this.currentOrder.apply_pos_promotion();
                        this.currentOrder.apply_pos_order_discount_total();
                    }else{
                        super._setValue(val);
//                        this.currentOrder.apply_pos_promotion();
                        this.currentOrder.apply_pos_order_discount_total();
                    }
                }else{
                    if(selectedLine && await selectedLine.get_promotion()){
                        return false;
                    } else {
                        super._setValue(val);
                        this.currentOrder.apply_pos_promotion();
                        this.currentOrder.apply_pos_order_discount_total();
                    }
                }
                if(this.currentOrder && this.currentOrder.get_order_total_discount()){
                    let promotion = this.currentOrder.get_order_total_discount();
                    if(promotion.total_amount > this.currentOrder.get_total_with_tax()){
                        let removeLine = this.currentOrder.get_order_total_discount_line()
                        this.currentOrder.remove_orderline(removeLine)
                    }
                }
            }

      }
    Registries.Component.extend(ProductScreen, PromotionProductScreenInh);

    return ProductScreen;

});
