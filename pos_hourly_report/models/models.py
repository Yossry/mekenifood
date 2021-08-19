# -*- coding: utf-8 -*-
import pytz

from odoo import models, fields, api


class PosOrder(models.Model):
    _inherit = "pos.order"

    order_date = fields.Date("Order Date", compute="compute_order_date_time", store=True)
    order_in_hour = fields.Selection([('0', '00:00 - 00:59 hrs'),
                                      ('1', '01:00 - 01:59 hrs'),
                                      ('2', '02:00 - 02:59 hrs'),
                                      ('3', '03:00 - 03:59 hrs'),
                                      ('4', '04:00 - 04:59 hrs'),
                                      ('5', '05:00 - 05:59 hrs'),
                                      ('6', '06:00 - 06:59 hrs'),
                                      ('7', '07:00 - 07:59 hrs'),
                                      ('8', '08:00 - 08:59 hrs'),
                                      ('9', '09:00 - 09:59 hrs'),
                                      ('10', '10:00 - 10:59 hrs'),
                                      ('11', '11:00 - 11:59 hrs'),
                                      ('12', '12:00 - 12:59 hrs'),
                                      ('13', '13:00 - 13:59 hrs'),
                                      ('14', '14:00 - 14:59 hrs'),
                                      ('15', '15:00 - 15:59 hrs'),
                                      ('16', '16:00 - 16:59 hrs'),
                                      ('17', '17:00 - 17:59 hrs'),
                                      ('18', '18:00 - 18:59 hrs'),
                                      ('19', '19:00 - 19:59 hrs'),
                                      ('20', '20:00 - 20:59 hrs'),
                                      ('21', '21:00 - 21:59 hrs'),
                                      ('22', '22:00 - 22:59 hrs'),
                                      ('23', '23:00 - 23:59 hrs')
                                      ])

    @api.depends('date_order')
    def compute_order_date_time(self):
        for rec in self:
            date_time = rec.date_order
            if date_time:
                rec.order_date = date_time.date()
                user_time_zone = pytz.timezone(self.env.user.partner_id.tz)
                user_time = pytz.utc.localize(date_time, is_dst=False)
                now_local_datetime = user_time.astimezone(user_time_zone)
                time = now_local_datetime.time()
                time_in_float = time.hour
                rec.order_in_hour = str(time_in_float)
            else:
                rec.order_date = False
                rec.order_in_hour = False


class PosOrderReport(models.Model):
    _inherit = "report.pos.order"
    _order = 'date desc, order_in_hour desc'

    order_in_hour = fields.Selection([('0', '00:00 - 00:59 hrs'),
                                      ('1', '01:00 - 01:59 hrs'),
                                      ('2', '02:00 - 02:59 hrs'),
                                      ('3', '03:00 - 03:59 hrs'),
                                      ('4', '04:00 - 04:59 hrs'),
                                      ('5', '05:00 - 05:59 hrs'),
                                      ('6', '06:00 - 06:59 hrs'),
                                      ('7', '07:00 - 07:59 hrs'),
                                      ('8', '08:00 - 08:59 hrs'),
                                      ('9', '09:00 - 09:59 hrs'),
                                      ('10', '10:00 - 10:59 hrs'),
                                      ('11', '11:00 - 11:59 hrs'),
                                      ('12', '12:00 - 12:59 hrs'),
                                      ('13', '13:00 - 13:59 hrs'),
                                      ('14', '14:00 - 14:59 hrs'),
                                      ('15', '15:00 - 15:59 hrs'),
                                      ('16', '16:00 - 16:59 hrs'),
                                      ('17', '17:00 - 17:59 hrs'),
                                      ('18', '18:00 - 18:59 hrs'),
                                      ('19', '19:00 - 19:59 hrs'),
                                      ('20', '20:00 - 20:59 hrs'),
                                      ('21', '21:00 - 21:59 hrs'),
                                      ('22', '22:00 - 22:59 hrs'),
                                      ('23', '23:00 - 23:59 hrs')
                                      ])

    def _select(self):
        return """
            SELECT
                MIN(l.id) AS id,
                COUNT(*) AS nbr_lines,
                s.date_order AS date,
                s.order_in_hour AS order_in_hour,
                SUM(l.qty) AS product_qty,
                SUM(l.qty * l.price_unit / CASE COALESCE(s.currency_rate, 0) WHEN 0 THEN 1.0 ELSE s.currency_rate END) AS price_sub_total,
                SUM((l.qty * l.price_unit) * (100 - l.discount) / 100 / CASE COALESCE(s.currency_rate, 0) WHEN 0 THEN 1.0 ELSE s.currency_rate END) AS price_total,
                SUM((l.qty * l.price_unit) * (l.discount / 100) / CASE COALESCE(s.currency_rate, 0) WHEN 0 THEN 1.0 ELSE s.currency_rate END) AS total_discount,
                (SUM(l.qty*l.price_unit / CASE COALESCE(s.currency_rate, 0) WHEN 0 THEN 1.0 ELSE s.currency_rate END)/SUM(l.qty * u.factor))::decimal AS average_price,
                SUM(cast(to_char(date_trunc('day',s.date_order) - date_trunc('day',s.create_date),'DD') AS INT)) AS delay_validation,
                s.id as order_id,
                s.partner_id AS partner_id,
                s.state AS state,
                s.user_id AS user_id,
                s.company_id AS company_id,
                s.sale_journal AS journal_id,
                l.product_id AS product_id,
                pt.categ_id AS product_categ_id,
                p.product_tmpl_id,
                ps.config_id,
                pt.pos_categ_id,
                s.pricelist_id,
                s.session_id,
                s.account_move IS NOT NULL AS invoiced
        """

    def _group_by(self):
        return """
             GROUP BY
                 s.id, s.date_order, s.order_in_hour, s.partner_id,s.state, pt.categ_id,
                 s.user_id, s.company_id, s.sale_journal,
                 s.pricelist_id, s.account_move, s.create_date, s.session_id,
                 l.product_id,
                 pt.categ_id, pt.pos_categ_id,
                 p.product_tmpl_id,
                 ps.config_id
         """
