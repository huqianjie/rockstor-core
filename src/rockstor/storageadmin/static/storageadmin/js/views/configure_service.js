/*
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this page.
 *
 * Copyright (c) 2012-2013 RockStor, Inc. <http://rockstor.com>
 * This file is part of RockStor.
 *
 * RockStor is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published
 * by the Free Software Foundation; either version 2 of the License,
 * or (at your option) any later version.
 *
 * RockStor is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */

ConfigureServiceView = RockstorLayoutView.extend({
    events: {
	"click #cancel": "cancel",
	"click #security": "toggleFormFields",
	"click #enabletls": "toggleCertUrl"
    },

    initialize: function() {
	// call initialize of base
	var _this = this;
	this.constructor.__super__.initialize.apply(this, arguments);
	this.serviceName = this.options.serviceName;
	// set template
	this.template = window.JST['services_configure_' + this.serviceName];
	this.rules = {
	    ntpd: { server: 'required' },
	    smb: { workgroup: 'required' },
	    nis: { domain: 'required', server: 'required' },
	    snmpd: { syslocation: 'required', syscontact: 'required',rocommunity: 'required'},
	    winbind: {domain: 'required', controllers: 'required',
		      security: 'required',
		      realm: {
			  required: {
			      depends: function(element) {
				  return (_this.$('#security').val() == 'ads');
			      }
			  }
		      },
		      templateshell: {
			  required: {
			      depends: function(element) {
				  return ((_this.$('#security').val() == 'ads') ||
					  (_this.$('#security').val() == 'domain'));
			      }
			  }
		      }
		     },
	    ldap: {
		server: 'required',
		basedn: 'required',
		cert: {
		    required: {
			depends: function(element) {
			    return _this.$('#enabletls').prop('checked');
				}
		    }
		}
	    },
	    docker:{
    		rootshare: 'required'
	    },
	    nut: {
		mode: 'required',
		nutuser: 'required',
		nutpass: 'required',
		nutserver: {
		    required: {
			depends: function(element) {
				return (_this.$('#mode').val() == 'netclient');
				}
		    }
		}
	    }
	}
	this.formName = this.serviceName + '-form';
	this.service = new Service({name: this.serviceName});
	this.dependencies.push(this.service);
	this.shares = new ShareCollection();
	this.shares.setPageSize(100);
	this.dependencies.push(this.shares);

    },

    render: function() {
	this.fetch(this.renderServiceConfig, this);
	return this;
    },

    renderServiceConfig: function() {
	var _this = this;
	var config = this.service.get('config');
	var configObj = {};
	if (config != null) {
	    configObj = JSON.parse(this.service.get('config'));
	}
	$(this.el).html(this.template({service: this.service, config: configObj, shares: this.shares}));

	this.$('#nis-form :input').tooltip({
    	    html: true,
            placement: 'right'
	});
	this.$('#snmpd-form :input').tooltip({
            html: true,
            placement: 'right'
	});
	this.$('#ldap-form :input').tooltip({
    	    html: true,
            placement: 'right'
	});
	this.$('#ntpd-form :input').tooltip({
    	    html: true,
            placement: 'right'
	});
	this.$('#smb-form :input').tooltip({
	    html: true,
	    placement: 'right'
	});
	this.$('#docker-form #root_share').tooltip({
    	    html: true,
            placement: 'right',
            title: 'We strongly recommend that you create a separate Share(at least 5GB size) for this purpose. During the lifetime of Rock-ons, several snapshots will be created and space could fill up quickly. It is best managed in a separate Share to avoid clobbering other data.'
	});
	this.$('#winbind-form #domain').tooltip({
	    html: true,
	    placement: 'right',
	    title: 'Specifies the Windows Active Directory or domain controller to connect to.'
	});
	this.$('#winbind-form #security').tooltip({
	    html: true,
	    placement: 'right',
	    title: "<strong>Security Model</strong> — Allows you to select a security model, which configures how clients should respond to Samba. The drop-down list allows you select any of the following:<br> \
<ul>\
<li><strong>ads</strong> — This mode instructs Samba to act as a domain member in an Active Directory Server (ADS) realm. To operate in this mode, the krb5-server package must be installed, and Kerberos must be configured properly.</li> \
<li><strong>domain</strong> — In this mode, Samba will attempt to validate the username/password by authenticating it through a Windows NT Primary or Backup Domain Controller, similar to how a Windows NT Server would.</li> \
<li><strong>server</strong> — In this mode, Samba will attempt to validate the username/password by authenticating it through another SMB server (for example, a Windows NT Server). If the attempt fails, the user mode will take effect instead.</li> \
<li><strong>user</strong> — This is the default mode. With this level of security, a client must first log in with a valid username and password. Encrypted passwords can also be used in this security mode.</li> \
</ul>"
	});
	this.$('#winbind-form #realm').tooltip({
	    html: true,
	    placement: 'right',
	    title: 'When the ads Security Model is selected, this allows you to specify the ADS Realm the Samba server should act as a domain member of.'
	});
	this.$('#winbind-form #controllers').tooltip({
	    html: true,
	    placement: 'right',
	    title: 'Use this option to specify which domain controller winbind should use.'
	});
	this.$('#winbind-form #templateshell').tooltip({
	    html: true,
	    placement: 'right',
	    title: 'When filling out the user information for a Windows NT user, the winbindd daemon uses the value chosen here to to specify the login shell for that user.'
	});
	this.$('#smartd-form #smartd_config').tooltip({
	    html: true,
	    placement: 'right',
	    title: 'Following are a few example directives. For complete information, read smard.conf manpage.<br> \
To monitor all possible errors on all disks: <br> <strong>DEVICESCAN -a</strong> <br> \
To monitor /dev/sdb and /dev/sdc but ignore other devices: <br> <strong>/dev/sdb -a</strong> <br> <strong>/dev/sdc -a</strong> <br> \
To email potential problems: <br> <strong>DEVICESCAN -m user@example.com</strong> <br> \
To alert on temparature changes: <br> <strong>DEVICESCAN -W 4,35,40</strong> <br>'
	});
	this.$('#nut-form #mode').tooltip({
	    html: true,
	    placement: 'right',
	    title: "<strong>Nut Mode</strong> — Allows you to select the overall mode of Network UPS Tools operation. The drop-down list offers the following options:<br> \
<ul>\
<li><strong>None</strong> — The Default and essentially disables NUT.</li> \
<li><strong>Standalone</strong> — The most common and recommended mode if you have a locally connected UPS and don't wish for Rockstor to act as a NUT server to any other LAN connected machines.</li> \
<li><strong>Nut server</strong> — Is like Standalone only it also offers NUT services to other machines on the network who are running in Net client mode.</li> \
<li><strong>Net client</strong> — Connect to an existing Nut server or network attached UPS on the LAN.</li> \
</ul>"
	});
	this.$('#nut-form #upsname').tooltip({
	    html: true,
	    placement: 'right',
	    title: 'The internal name for the UPS eg "ups" Leave blank if unsure.'
	});
	this.$('#nut-form #nutserver').tooltip({
	    html: true,
	    placement: 'right',
	    title: 'The hostname or IP address of the NUT server.'
	});
		this.$('#nut-form #nutuser').tooltip({
	    html: true,
	    placement: 'right',
	    title: 'The NUT username eg "monuser" (not a Rockstor user). Must be a single word without special characters. A default will be created if left blank'
	});
	this.$('#nut-form #nutuserpass').tooltip({
	    html: true,
	    placement: 'right',
	    title: 'The password for the above nut user. Avoid using the following characters ( " = # space or backslash )'
	});

	this.validator = this.$('#' + this.formName).validate({
	    onfocusout: false,
	    onkeyup: false,
	    rules: this.rules[this.serviceName],

	    submitHandler: function() {
		var button = _this.$('#submit');
		if (buttonDisabled(button)) return false;
		disableButton(button);
		if(_this.formName == 'snmpd-form')
		{
		    var optionsText = _this.$('#options').val();
		    var entries = [];
		    if (!_.isNull(optionsText) && optionsText.trim() != '') entries = optionsText.trim().split('\n');
		    var params = (_this.$('#' + _this.formName).getJSON());
		    params.aux = entries;
		    var data = JSON.stringify({config: params});
		}else{
		    var data = JSON.stringify({config: _this.$('#' + _this.formName).getJSON()});
		}

		var jqxhr = $.ajax({
		    url: "/api/sm/services/" + _this.serviceName + "/config",
		    type: "POST",
		    contentType: 'application/json',
		    dataType: "json",
		    data: data,
		});

		jqxhr.done(function() {
        	    enableButton(button);
		    app_router.navigate("services", {trigger: true});
		});

		jqxhr.fail(function(xhr, status, error) {
		    enableButton(button);
		});

            }
        });

	return this;
    },

    cancel: function() {
	app_router.navigate("services", {trigger: true});
    },

    toggleFormFields: function() {
	if (this.$('#security').val() == 'ads') {
	    this.$('#realm').removeAttr('disabled');
	} else {
	    this.$('#realm').attr('disabled', 'true');
	}
	if (this.$('#security').val() == 'ads'
            || this.$('#security').val() == 'domain') {
	    this.$('#templateshell').removeAttr('disabled');
	} else {
	    this.$('#templateshell').attr('disabled', 'true');
	}
    },

    toggleCertUrl: function() {
	var cbox = this.$('#enabletls');
	if (cbox.prop('checked')) {
	    this.$('#cert-ph').css('visibility','visible');
	} else {
	    this.$('#cert-ph').css('visibility','hidden');
	}
    },


});
