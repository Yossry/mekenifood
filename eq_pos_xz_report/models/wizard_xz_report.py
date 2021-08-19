# -*- coding: utf-8 -*-
##############################################################################
#
# Copyright 2019 EquickERP
#
##############################################################################

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class wizard_xz_report(models.TransientModel):
    _name = 'wizard.xz.report'
    _description = 'Wizard XZ Report'

    session_ids = fields.Many2many(comodel_name='pos.session', string="Session")
    start_date = fields.Datetime(string="Start Date")
    end_date = fields.Datetime(string="End Date")
    show_top_saling_product = fields.Boolean(string="Show Top Selling Product")
    no_of_product_disp = fields.Integer(string="Number of Product to Display", default=5)
    display_category_product = fields.Boolean(string="Show Sales by Category?")

    def get_data(self):
        data = self.read()[0]
        domain = []
        if all([not data.get(fld) for fld in ['start_date', 'end_date', 'session_ids']]):
            raise ValidationError(_("Please select at least one criteria to print report."))
        if self.session_ids:
            domain += [('id', 'in', self.session_ids.ids)]
        if self.start_date:
            domain += [('start_at', '>=', self.start_date)]
        # X report
        if self.env.context.get('x_report'):
            domain += [('state', '!=', 'closed')]
            if self.end_date:
                domain += [('start_at', '<=', self.end_date)]
        # Z report
        if self.env.context.get('z_report'):
            domain += [('state', '=', 'closed')]
            if self.end_date: 
                domain += [('stop_at', '<=', self.end_date)]
        # search
        session_ids = self.env['pos.session'].search(domain)
        if not session_ids:
            raise ValidationError(_("No Session found for selected criteria."))
        data.update({'session_ids': session_ids.ids})
        return data

    def btn_print_x_report(self):
        data = self.with_context(x_report=True).get_data()
        return self.env.ref('eq_pos_xz_report.action_print_x_report').report_action([], data=data)

    def btn_print_z_report(self):
        data = self.with_context(z_report=True).get_data()
        return self.env.ref('eq_pos_xz_report.action_print_z_report').report_action([], data=data)


class eq_pos_xz_report_x_report_template(models.AbstractModel):
    _name = 'report.eq_pos_xz_report.x_report_template'
    _description = 'x_report_template'

    @api.model
    def _get_report_values(self, docids, data=None):
        report = self.env['ir.actions.report']._get_report_from_name('eq_pos_xz_report.x_report_template')
        session_ids = self.env['pos.session'].browse(data['session_ids'])
        return {'doc_ids' : self.ids,
                'doc_model': report,
                'docs': session_ids,
                'data': data}


class eq_pos_xz_report_z_report_template(models.AbstractModel):
    _name = 'report.eq_pos_xz_report.z_report_template'
    _description = 'z_report_template'

    @api.model
    def _get_report_values(self, docids, data=None):
        report = self.env['ir.actions.report']._get_report_from_name('eq_pos_xz_report.z_report_template')
        session_ids = self.env['pos.session'].browse(data['session_ids'])
        return {'doc_ids' : self.ids,
                'doc_model': report,
                'docs': session_ids,
                'data':data}

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4: