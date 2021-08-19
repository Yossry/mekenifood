# -*- coding: utf-8 -*-
{
    'name': "POS Orders Hourly Report",

    'summary': """Get the POS sales report by hours""",

    'description': """
       This module gives you an option to get the POS Orders report by hours, means In a
                                particular hour which orders are placed.
    """,
    'author': 'Webveer',
    'category': 'Point of Sale',
    'version': '1.0',

    # any module necessary for this one to work correctly
    'depends': ['point_of_sale'],

    # always loaded
    'data': [
        'views/views.xml',
    ],
    # only loaded in demonstration mode
    'demo': [
    ],
    'images': ['static/description/banner.jpg'],
    'installable': True,
    'application': True,
    'website': '',
    'auto_install': False,
    'price': 20,
    'currency': 'EUR',
}
