odoo.define('aspl_pos_promotion.models', function (require) {
"use strict";

    var models = require('point_of_sale.models');

    models.load_fields("product.product", ['product_brand_id']);

    models.PosModel.prototype.models.push({
        model:  'pos.promotion',
        fields: [],
        domain: function(self){
            var current_date = moment(new Date()).locale('en').format("YYYY-MM-DD");
            var weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
            var d = new Date();
            var current_day = weekday[d.getDay()]
            return [['from_date','<=',current_date],['to_date','>=',current_date],['active','=',true],
                    ['day_of_week_ids.name','in',[current_day]]];
        },
        loaded: function(self, promotions){
            self.pos_promotions = promotions;
            self.promotions_by_id = {};
            _.each(promotions, function(promo){
                self.promotions_by_id[promo.id] = promo;
            })
        },
    },{
        model:  'pos.conditions',
        fields: [],
        loaded: function(self,pos_conditions){
            self.pos_conditions_by_id = {};
            self.pos_conditions = pos_conditions;
            _.each(pos_conditions, function(promo){
                self.pos_conditions_by_id[promo.id] = promo;
            })
        },
    },{
        model:  'get.discount',
        fields: [],
        loaded: function(self, pos_get_discount){
            self.get_discount_by_id = {};
            self.get_discount = pos_get_discount;
            _.each(pos_get_discount, function(promo){
                self.get_discount_by_id[promo.id] = promo;
            })
        },
    },{
        model:  'quantity.discount',
        fields: [],
        loaded: function(self, pos_get_qty_discount){
            self.pos_get_qty_discount = pos_get_qty_discount;
            self.get_qty_discount_by_id = {};
            for(let value of pos_get_qty_discount){
                self.get_qty_discount_by_id[value.id] = value;
            }
        },
    },{
        model:  'quantity.discount.amt',
        fields: [],
        loaded: function(self,pos_qty_discount_amt){
            self.pos_qty_discount_amt_by_id = {};
            self.pos_qty_discount_amt = pos_qty_discount_amt;
            _.each(pos_qty_discount_amt, function(promo){
                self.pos_qty_discount_amt_by_id[promo.id] = promo;
            })
        },
    },{
        model:  'discount.multi.products',
        fields: [],
        loaded: function(self,pos_discount_multi_prods){
            self.pos_discount_multi_prods = pos_discount_multi_prods;
            self.pos_discount_multi_prods_by_id = {}
            for(const disc of pos_discount_multi_prods){
                self.pos_discount_multi_prods_by_id[disc.id] = disc;
            }
        },
    },{
        model:  'discount.multi.categories',
        fields: [],
        loaded: function(self, pos_discount_multi_category){
            self.pos_discount_multi_category = pos_discount_multi_category;
            self.pos_discount_multi_category_by_id = {}
            for(const disc of pos_discount_multi_category){
                self.pos_discount_multi_category_by_id[disc.id] = disc;
            }
        },
    },{
        model:  'discount.above.price',
        fields: [],
        loaded: function(self,pos_discount_above_price){
            self.pos_discount_above_price = pos_discount_above_price;
        },
    });

    var SuperOrder = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function(attributes,options){
            var res = SuperOrder.initialize.apply(this, arguments);
            this.orderPromotion = this.orderPromotion || false;
            this.orderDiscountLine = this.orderDiscountLine || false;
            return res;
        },
        init_from_JSON: function(json){
            SuperOrder.init_from_JSON.apply(this,arguments);
            this.orderPromotion = json.orderPromotion;
            this.orderDiscountLine = json.orderDiscountLine;
        },
        export_as_JSON: function() {
            var orders = SuperOrder.export_as_JSON.call(this);
            orders.orderPromotion = this.orderPromotion || false;
            orders.orderDiscountLine = this.orderDiscountLine || false;
            return orders;
        },
        set_order_total_discount_line : function(line){
            this.orderDiscountLine = line;
        },
        get_order_total_discount_line : function(){
            return this.orderDiscountLine;
        },
        get_orderline_by_unique_id: function(uniqueId){
            var orderlines = this.orderlines.models;
            for(var i = 0; i < orderlines.length; i++){
                if(orderlines[i].uniqueChildId === uniqueId){
                    return orderlines[i];
                }
            }
            return null;
        },
        set_order_total_discount : function(promotion){
            this.orderPromotion = promotion;
        },
        get_order_total_discount : function(){
            return this.orderPromotion;
        },
        apply_pos_order_discount_total : async function(){
            var filteredPromotion = _.filter(this.pos.pos_promotions, function(promotion){
                                                        return promotion.promotion_type == 'discount_total'
                                                })
            var total = this.get_total_with_tax();
            for(const promotion of filteredPromotion){
                if(!this.check_for_valid_promotion(promotion))
                    return;
                var discountProduct = this.pos.db.get_product_by_id(promotion.discount_product[0]);
                if(total >= promotion.total_amount){
                    var isDiscount = await this.remove_discount_product(promotion)
                    var createNewDiscountLine = new models.Orderline({}, {pos: this.pos,
                                                        order: this.pos.get_order(), product: discountProduct});
                    const discount = - (total * promotion.total_discount)/100;
                    createNewDiscountLine.set_quantity(1);
                    createNewDiscountLine.price_manually_set = true;
                    createNewDiscountLine.set_unit_price(discount);
                    createNewDiscountLine.set_promotion(promotion);
                    this.orderlines.add(createNewDiscountLine);
                    this.add_orderline(createNewDiscountLine);
                    this.set_order_total_discount(promotion);
                    this.set_order_total_discount_line(createNewDiscountLine);
                }
            }
        },
        remove_discount_product : function(promotion){
            for(const _line of this.get_orderlines()){
                if(_line.product.id === promotion.discount_product[0]){
                    this.remove_orderline(_line);
                    return true;
                }
            }
        },
        check_for_valid_promotion: function(promotion){
            var current_time = Number(moment(new Date().getTime()).locale('en').format("H"));
            if((Number(promotion.from_time) <= current_time && Number(promotion.to_time) > current_time) ||
                (!promotion.from_time && !promotion.to_time)){
                return true;
            } else{
                return false;
            }
        },
        add_product: function(product, options){
            SuperOrder.add_product.apply(this, arguments);
            this.apply_pos_promotion(product);
            this.apply_pos_order_discount_total();
        },
        apply_pos_promotion: function(product){
            var current_time = Number(moment(new Date().getTime()).locale('en').format("H"));
            var selectedLine =  this.get_selected_orderline();

            for(var promotion of this.pos.pos_promotions){
                let promotion_type = promotion.promotion_type;
                let flag = false;
                switch (promotion_type) {
                    case 'buy_x_get_y':
                        this.apply_buy_x_get_y_promotion(promotion);
                        break;
                    case 'buy_x_get_dis_y':
                        this.apply_buy_x_disc_y_promotion(promotion);
                        break;
                    case 'quantity_discount':
                        this.apply_quantity_discount(promotion);
                        break;
                    case 'quantity_price':
                        this.apply_quantity_price(promotion);
                        break;
                    case 'discount_on_multi_product':
                        this.apply_discount_on_multi_product(promotion);
                        break;
                    case 'discount_on_multi_category':
                        this.apply_discount_on_multi_category(promotion, product);
                        break;
                }
            }
        },
        //BUY X GET Y FREE PROMOTION START FROM LINE 168 - 218
        update_promotion_line : function(orderLine, prom_prod_id, promotion, final_qty){
            let promo_product = this.pos.db.get_product_by_id(prom_prod_id);
            var currentOrderLine = this.get_selected_orderline();

            if(!orderLine){
                var new_line = new models.Orderline({}, {pos: this.pos, order: this.pos.get_order(), product: promo_product});
                    new_line.set_quantity(final_qty);
                    new_line.price_manually_set = true;
                    new_line.set_unit_price(0);
                    new_line.set_unique_child_id(currentOrderLine.get_unique_parent_id());
                    new_line.set_promotion(promotion);
                    this.pos.get_order().add_orderline(new_line);
            }else{
                orderLine.price_manually_set = true;
                orderLine.set_unit_price(0);
                orderLine.set_quantity(final_qty);
            }
            this.select_orderline(currentOrderLine);
        },

        apply_buy_x_get_y_promotion: async function(promotion){
            if(!this.check_for_valid_promotion(promotion))
                return;
            var selectedOrderLine = this.get_selected_orderline();
            if(selectedOrderLine && promotion.pos_condition_ids.length > 0){
                for(const _line_id of promotion.pos_condition_ids){
                    var _record = this.pos.pos_conditions_by_id[_line_id];
                    if(selectedOrderLine.product.id === _record.product_x_id[0]){

                        let prom_qty = Math.floor(selectedOrderLine.quantity / _record.quantity);
                        let final_qty = Math.floor(prom_qty * _record.quantity_y);
                        if(_record.operator === 'greater_than_or_eql' && selectedOrderLine.quantity >= _record.quantity){
                            if(selectedOrderLine && !selectedOrderLine.get_unique_parent_id()){
                                selectedOrderLine.set_unique_parent_id(Math.floor(Math.random() * 1000000000));
                            }
                            var parentId = await selectedOrderLine ? selectedOrderLine.get_unique_parent_id() : false;
                            var childOrderLine = this.get_orderline_by_unique_id(parentId ? selectedOrderLine.get_unique_parent_id() : false);
                            this.update_promotion_line(childOrderLine, _record.product_y_id[0], promotion, final_qty);
                        }
                        break;
                    }
                }
            }
        },
        //BUY X GET Y FREE PROMOTION END
        apply_buy_x_disc_y_promotion: function(promotion){
            if(!this.check_for_valid_promotion(promotion))
                return;
            var SelectedLine = this.get_selected_orderline();
            var _lineById = [];
            var orderLines = _.filter(this.get_orderlines(), function(line){
                                 if(!line.get_promotion()){
                                     return line;
                                 }
                             });
            var lineProductIds = _.pluck(_.pluck(orderLines, 'product'),  'id');
            var flag = false;
            var discountLineList = [];
            if(promotion && !promotion.parent_product_ids){
                return false;
            };
            for(var _line of orderLines){
                if(_.contains(promotion && promotion.parent_product_ids, _line.product.id)){
                    if(!_line.get_promotion_flag() && !_line.get_unique_parent_id()){
                        _lineById.push(_line);
                    }
                    for(const discId of promotion.pos_quantity_dis_ids){
                        let discountLineRecord = this.pos.get_discount_by_id[discId];
                            discountLineRecord && discountLineRecord.product_id_dis ? discountLineList.push(discountLineRecord) : '';
                    }
                    flag = true;
                    break;
                }
            }
            if(!flag){
                return;
            }
            for(var _line of orderLines){
                for(const _discount of discountLineList){
                    if(_discount.product_id_dis && _discount.product_id_dis[0] == _line.product.id){
                        var parentLine =  _.filter(_lineById, function(line){
                                     if(!line.get_promotion_disc_parent_id() && _.contains(promotion.parent_product_ids, line.product.id)){
                                         return line;
                                     }
                                 });
                        if(parentLine.length > 0 && _line.quantity >= _discount.qty){
                            if(parentLine.length > 0 && !parentLine[0].get_promotion_disc_parent_id()){
                                parentLine[0].set_promotion_disc_parent_id(Math.floor(Math.random() * 1000000000));
                                parentLine[0].set_unique_parent_id(null);
                                parentLine[0].set_promotion_flag(true);
                            }
                            _line.set_promotion(promotion);
                            _line.set_discount(_discount.discount_dis_x);
                            _line.set_promotion_disc_child_id(parentLine[0].get_promotion_disc_parent_id());
                        }
                    }
                }
            }
        },
        //APPLY PERCENTAGE DISCOUNT ON QUANTITY DONE
        apply_quantity_discount: function(promotion){
            if(!this.check_for_valid_promotion(promotion))
                return;
            var selected_line = this.get_selected_orderline();
            const {product_id_qty} = promotion;
            if(selected_line && product_id_qty && product_id_qty[0] === selected_line.product.id){
                for(const promo_id of promotion.pos_quantity_ids){
                    var line_record = this.pos.get_qty_discount_by_id[promo_id];
                    if(line_record && selected_line.quantity >= line_record.quantity_dis){
                        if(line_record.discount_dis){
                            selected_line.set_promotion(promotion);
                            selected_line.set_discount(line_record.discount_dis);
                        }
                    }
                }
            }
        },
        //APPLY PERCENTAGE DISCOUNT ON QUANTITY END
        apply_quantity_price: function(promotion){
            if(!this.check_for_valid_promotion(promotion))
                return;
            var selected_line = this.get_selected_orderline();
            if(selected_line && promotion.product_id_amt && promotion.product_id_amt[0] == selected_line.product.id){
                for(const qty_amt_id of promotion.pos_quantity_amt_ids){
                    let line_record = this.pos.pos_qty_discount_amt_by_id[qty_amt_id];
                    if(line_record && selected_line.quantity >= line_record.quantity_amt){
                        if(line_record.discount_price){
                            selected_line.set_promotion(promotion);
                            selected_line.set_unit_price(((selected_line.get_unit_price() * selected_line.get_quantity()) -
                            line_record.discount_price)/selected_line.get_quantity());
                            break;
                        }
                    }
                }
            }
        },
        // APPLY DISCOUNT ON MULTIPLE PRODUCTS
        apply_discount_on_multi_product: function(promotion){
            if(!this.check_for_valid_promotion(promotion))
                return;
            if(promotion.multi_products_discount_ids){
                for(const disc_line_id of promotion.multi_products_discount_ids){
                    var disc_line_record = this.pos.pos_discount_multi_prods_by_id[disc_line_id];
                    if(disc_line_record){
                        this.check_products_for_disc(disc_line_record, promotion);
                    }
                }
            }
        },
        // APPLY DISCOUNT ON MULTIPLE PRODUCTS METHOD - check_products_for_disc
        check_products_for_disc: function(disc_line, promotion){
            var self = this;
            var lines = _.filter(self.get_orderlines(), function(line){
                            if(!line.get_promotion()){
                                return line;
                            }
                        });
            var product_cmp_list = [];
            var orderLine_ids = [];
            var products_qty = [];
            if(disc_line.product_ids && disc_line.products_discount){
                _.each(lines, function(line){
                    if(_.contains(disc_line.product_ids, line.product.id)){
                        product_cmp_list.push(line.product.id);
                        orderLine_ids.push(line.id);
                        products_qty.push(line.get_quantity());
                    }
                });
                if(!_.contains(products_qty, 0)){
                    if(_.isEqual(_.sortBy(disc_line.product_ids), _.sortBy(product_cmp_list))){
                        const combination_id = Math.floor(Math.random() * 1000000000);
                        _.each(orderLine_ids, function(orderLineId){
                            var order_line = self.get_orderline(orderLineId);
                            if(order_line && order_line.get_quantity() > 0){
                                order_line.set_discount(disc_line.products_discount);
                                order_line.set_promotion(promotion);
                                order_line.set_combination_id(combination_id);
                            }
                        });
                    }
                }
            }
        },

        // APPLY DISCOUNT ON MULTIPLE CATEGORIES DONE
        apply_discount_on_multi_category: function(promotion, product){
            if(!this.check_for_valid_promotion(promotion))
                return;
            var selected_line = this.get_selected_orderline();
            if(!product) return;
            if(promotion.multi_category_discount_ids){
                for(const disc_id of promotion.multi_category_discount_ids){
                    let disc_obj = this.pos.pos_discount_multi_category_by_id[disc_id];
                    if(disc_obj && disc_obj.category_ids && disc_obj.category_discount, product.pos_categ_id[0]){
                        if(_.contains(disc_obj.category_ids ,  product.pos_categ_id[0])){
                            selected_line.set_discount(disc_obj.category_discount);
                            selected_line.set_promotion(promotion);
                            break;
                        }
                    }
                }
            };
        },
    });

    var SuperOrderLine = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        initialize: function(attr,options){
            this.uniqueChildId = this.uniqueChildId || false;
            this.uniqueParentId = this.uniqueParentId || false;
            this.isRuleApplied = this.isRuleApplied || false;
            this.promotionRule = this.promotionRule || false;
            this.promotion = this.promotion || false;
            this.combination_id = this.combination_id || false;
            this.promotion_flag = this.promotion_flag || false;
            this.promotion_disc_parentId = this.promotion_disc_parentId || false;
            this.promotion_disc_childId = this.promotion_disc_childId || false;
            SuperOrderLine.initialize.call(this, attr, options);
        },
        set_promotion_flag : function(flag){
            this.promotion_flag = flag;
        },
        get_promotion_flag : function(flag){
            return this.promotion_flag;
        },
        set_promotion_disc_parent_id : function(parentId){
            this.promotion_disc_parentId = parentId;
        },
        get_promotion_disc_parent_id : function(){
            return this.promotion_disc_parentId;
        },
        set_promotion_disc_child_id : function(childId){
            this.promotion_disc_childId = childId;
        },
        get_promotion_disc_child_id : function(){
            return this.promotion_disc_childId;
        },
        set_combination_id : function(combinationId){
            this.combination_id = combinationId;
        },
        get_combination_id : function(){
            return this.combination_id;
        },
        //FOR BUY X GET Y FREE PRODUCT START
        set_unique_parent_id : function(uniqueParentId){
            this.uniqueParentId = uniqueParentId;
        },
        get_unique_parent_id(){
            return this.uniqueParentId;
        },
        set_unique_child_id : function(uniqueChildId){
            this.uniqueChildId = uniqueChildId;
        },
        get_unique_child_id(){
            return this.uniqueChildId;
        },
        //FOR BUY X GET Y FREE PRODUCT END
        set_promotion : function(promotion){
            this.promotion = promotion;
        },
        get_promotion : function(promotion){
            return this.promotion;
        },
        set_is_rule_applied : function(rule){
            this.applied_rule = rule;
        },
        get_is_rule_applied : function(){
            return this.applied_rule;
        },
        set_is_promotion_applied :function(rule){
            this.is_promotion_applied = rule;
        },
        get_is_promotion_applied :function(){
            return this.is_promotion_applied;
        },
//        can_be_merged_with: function(orderline) {
//            if (orderline.get_promotion_flag()) {
//                return false;
//            } else {
//                return SuperOrderLine.can_be_merged_with.apply(this,arguments);
//            }
//        },

        set_buy_x_get_dis_y: function(product_ids){
            this.product_ids = product_ids;
        },
        get_buy_x_get_dis_y: function(){
            return this.product_ids;
        },
        clone: function(){
            var orderLine = SuperOrderLine.clone.call(this);
            orderLine.uniqueParentId = this.uniqueParentId;
            orderLine.uniqueChildId = this.uniqueChildId;
            orderLine.isRuleApplied = this.isRuleApplied;
            orderLine.promotion = this.promotion;
            orderLine.combination_id = this.combination_id;
            orderLine.promotion_flag = this.promotion_flag;
            orderLine.promotion_disc_parentId = this.promotion_disc_parentId;
            orderLine.promotion_disc_childId = this.promotion_disc_childId;
            return orderLine;
        },
        export_for_printing: function() {
            var line = SuperOrderLine.export_for_printing.apply(this,arguments);
            line.promotion_code = this.promotion ? this.promotion.promotion_code : false;
            return line;
        },
        export_as_JSON: function(){
            var json = SuperOrderLine.export_as_JSON.call(this);
            json.uniqueParentId = this.uniqueParentId;
            json.uniqueChildId = this.uniqueChildId;
            json.isRuleApplied = this.isRuleApplied;
            json.promotion = this.promotion;
            json.combination_id = this.combination_id;
            json.promotion_flag = this.promotion_flag;
            json.promotion_disc_parentId = this.promotion_disc_parentId;
            json.promotion_disc_childId = this.promotion_disc_childId;
            return json;
        },
        init_from_JSON: function(json){
            this.uniqueParentId = json.uniqueParentId;
            this.uniqueChildId = json.uniqueChildId;
            this.isRuleApplied = json.isRuleApplied;
            this.promotion = json.promotion;
            this.promotion_flag = json.promotion_flag;
            this.promotion_disc_parentId = json.promotion_disc_parentId;
            this.promotion_disc_childId = json.promotion_disc_childId;
            SuperOrderLine.init_from_JSON.apply(this,arguments);
        }
    });
});