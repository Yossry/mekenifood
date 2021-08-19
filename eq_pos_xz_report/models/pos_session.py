# -*- coding: utf-8 -*-
##############################################################################
#
# Copyright 2019 EquickERP
#
##############################################################################

from odoo import models


class pos_session(models.Model):
    _inherit = 'pos.session'

    def get_total_session_discount(self, data):
        sales_detail_obj = self.env['report.point_of_sale.report_saledetails']
        result = sales_detail_obj.get_sale_details(session_ids=self.ids)
        discounts = result.get('products')
        taxes = result.get('taxes')
        qty = 0
        u_price = 0
        dis = 0
        total_dis = 0
        tax_amount = 0
        for i in discounts:
            qty = i.get('quantity')
            u_price = i.get('price_unit')
            dis = i.get('discount')
            total_dis += (u_price * qty) * dis / 100
        for j in taxes:
            tax_amount += j.get('tax_amount')
        new_res = {'session_all_payments': result.get('payments'),
                   'session_discounts': total_dis,
                   'session_taxes': tax_amount}
        pos_ol_domain = [('order_id', 'in', self.order_ids.ids)]
        report_product_lines = self.env['pos.order.line'].read_group(
            domain=pos_ol_domain,
            fields=['product_id', 'qty', 'price_subtotal'],
            groupby='product_id', orderby='qty desc')
        # Display data by Top selling
        top_sell_prod = []
        limit = data.get('no_of_product_disp')
        if len(report_product_lines) < limit:
            limit = len(report_product_lines)
        for index in range(limit):
            product_line = report_product_lines[index]
            product_id = self.env['product.product'].browse(product_line['product_id'][0])
            top_sell_prod.append({
                'id': product_id.id,
                'name': product_id.name,
                'qty': product_line['qty'],
                'sales': product_line['price_subtotal'],
            })
            new_res.update({'top_selling_products': top_sell_prod})
        # display data by Category
        if data.get('display_category_product'):
            categ_wise_total = {}
            for product_line in report_product_lines:
                product_id = self.env['product.product'].browse(product_line['product_id'][0])
                categ_id = product_id.categ_id
                if categ_id not in categ_wise_total:
                    categ_wise_total.update({categ_id: product_line['price_subtotal']})
                else:
                    categ_wise_total[categ_id] += product_line['price_subtotal']
            new_res.update({'display_category_product':categ_wise_total})
        return new_res

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4: