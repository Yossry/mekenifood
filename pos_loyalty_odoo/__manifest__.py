# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

{
    "name" : "POS Loyalty and Rewards Program in Odoo",
    "version" : "14.0.1.4",
    "category" : "Point of Sale",
    "depends" : ['base','sale','point_of_sale'],
    "author": "BrowseInfo",
    'summary': 'App helps POS Loyalty Management pos loyalty pos rewards pos club membership POS by Loyalty Program POS promotion pos offers pos customer loyalty POS Loyalty & Rewards Program pos Bonus Gift POS Referral pos coupons',
    "description": """
    
    Purpose :- 
This apps allows your cutomers to provide 
odoo POS loyalty management customer loyalty programs loyalty points and reward programs pos odoo
odo pos loyalty program pos loyalty and redeem program pos
odoo POS Loyalty and Rewards Program pos loyalty redeem pos loyalty points reward and redeem on pos
odoo pos redeem loyalty pos loyalty rewards pos rewards program pos loyalty redeem on pos
odoo pos loyalty programs pos loyalty cards pos loyalty discount pos
odoo point of sale loyalty program point of sale loyalty and redeem program point of sales
odoo point of sale Loyalty and Rewards Program point of sale loyalty redeem point of sale loyalty points reward and redeem on odoo
odoo point of sale redeem loyalty point of sale loyalty rewards point of sale rewards program
odoo point of sale loyalty redeem point of sales loyalty program point of sales loyalty and redeem program on pos
odoo point of sales Loyalty and Rewards Program point of sales loyalty redeem on point of sales
odoo point of sales loyalty points reward and redeem point of sales redeem loyalty on point of sales
odoo point of sales loyalty rewards point of sales rewards program point of sales loyalty redeem on pos
POS Loyalty and Rewards Redeem odoo apps is used to give POS loyalty redemption points for every purchase to your customers from point of sales screen.
Customer can also redeem this loyalty points for other purchase from the point of sale screen. 
Every single purchase from the point of sale records the Loyalty Rewards based on configuration setup on point of sale backend and those 
pos rewards will be redeemed on POS order from point of sale touch screen order easily. 
Reward redeems visible on applied point of sales order so it will be helpful for see history of the reward point redemption.
    
    
    """,
    "website" : "https://www.browseinfo.in",
    "price": 29,
    "currency": "EUR",
    "data": [
        'security/ir.model.access.csv',
        'views/custom_pos_view.xml',
        'views/pos_loyalty.xml',
    ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    "auto_install": False,
    "installable": True,
    "images":['static/description/Banner.png'],
    "live_test_url":'https://youtu.be/rXqA4irplrE',
}
# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
