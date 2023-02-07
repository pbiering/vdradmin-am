## supports following defines during RPM build:
##
## specified fork account/branch (EXAMPLE)
#
# rpmbuild --undefine=_disable_source_fetch -bb -D "fork_account pbiering" -D "fork_branch master" vdradmin-am.spec
#
## specific git commit/date on upstream (EXAMPLE)
#
# rpmbuild --undefine=_disable_source_fetch -bb -D "gitcommit 6ecf728e9a48871481abf5f569e510cd592ce961" -D "gitdate 20160629" vdradmin-am.spec
#
#
## rebuild from tarball requires related named tar.gz file and also related defines (EXAMPLE)
#
# rpmbuild -tb vdradmin-am-pbiering-master.tar.gz -D "fork_account pbiering" -D "fork_branch master"

%global debug_package %{nil}

%global vdradmin_user  vdradmin
%global vdradmin_group vdradmin

%define ver 3.6.10
%define rel 5.1

Name: vdradmin-am
BuildArch: noarch
Version:   %{ver}
Summary:   Web-based administration tool for vdr
License:   see /usr/share/doc/vdradmin/COPYING
URL:       https://github.com/vdr-projects/%{name}
Group:     Unspecified
Conflicts: vdradmin
Requires:  systemd
Requires:  vdr

Requires:  perl(locale)
Requires:  perl(Template)
Requires:  perl(Template::Plugin::JavaScript)
Requires:  perl(CGI)
Requires:  perl(HTTP::Date)
Requires:  perl(IO::Socket)
Requires:  perl(Time::Local)
Requires:  perl(MIME::Base64)
Requires:  perl(File::Temp)
Requires:  perl(File::Find)
Requires:  perl(URI)
Requires:  perl(URI::Escape)
Requires:  perl(HTTP::Tiny)
Requires:  perl(HTTP::Daemon)
Requires:  perl(Locale::gettext)
Requires:  perl(Net::SMTP)
Requires:  perl(Authen::SASL)
Requires:  perl(Digest::HMAC_MD5)
Requires:  perl(Encode)
Requires:  perl(IO::Socket::INET6)
Requires:  perl(HTTP::Daemon::SSL)
Requires:  perl(Compress::Zlib)
Requires:  perl(Sys::Syslog)
Requires:  perl(Regexp::IPv6)



%if 0%{?gitcommit:1}
%global gitshortcommit %(c=%{gitcommit}; echo ${c:0:7})
Release:        %{rel}.git.%{gitshortcommit}.%{gitdate}%{?dist}
%else
%if 0%{?fork_account:1}
%global fork_branch_normalized %(echo %{fork_branch} | sed 's/-/_/g')
Release:        %{rel}%{?fork_account:.%fork_account.%fork_branch_normalized}%{?dist}
%else
Release:        %{rel}%{?dist}
%endif
%endif


%if 0%{?fork_branch:1}
Source0:        https://github.com/%{fork_account}/%{name}/archive/%{fork_branch}/%{name}-%{fork_account}-%{fork_branch}.tar.gz
%else
%if 0%{?gitcommit:1}
Source0:        https://github.com/vdr-projects/%{name}/archive/%{gitcommit}/%{name}-%{gitshortcommit}.tar.gz
%else
Source0:        https://github.com/vdr-projects/%{name}/archive/v%{version}/%{name}-%{version}.tar.gz
%endif
%endif


%description
vdradmin-am provides a webinterface for managing
the Linux Video Disk Recorder (vdr)


%prep
%if 0%{?fork_account:1}
%setup -q -n %{name}-%{fork_branch}
%else
%if 0%{?gitcommit:1}
%setup -q -n %{name}-%{gitcommit}
%else
%setup -q -n %{name}-%{version}
%endif
%endif


%build
./make.sh po


%install
PREFIX=$RPM_BUILD_ROOT ./install.sh

# remove PREFIX implanted by ./install.sh into vdradmin
perl -pi -e "s#$RPM_BUILD_ROOT##g" $RPM_BUILD_ROOT/usr/bin/vdradmind

# move to sbin
install -d $RPM_BUILD_ROOT/usr/sbin
mv $RPM_BUILD_ROOT/usr/bin/vdradmind $RPM_BUILD_ROOT/usr/sbin/

# create directories
install -d $RPM_BUILD_ROOT/etc/vdradmin
install -d $RPM_BUILD_ROOT/etc/vdradmin/certs
install -d $RPM_BUILD_ROOT/etc/sysconfig
install -d $RPM_BUILD_ROOT/var/cache/vdradmin
install -d $RPM_BUILD_ROOT/var/log/vdradmin
install -d $RPM_BUILD_ROOT/var/lib/vdradmin
install -d $RPM_BUILD_ROOT/usr/lib/systemd/system

install contrib/vdradmin.service $RPM_BUILD_ROOT/usr/lib/systemd/system/

# support tools from package
install -d $RPM_BUILD_ROOT/usr/share/vdradmin
for file in convert.pl autotimer2searchtimer.pl; do
	install -m 755 $file $RPM_BUILD_ROOT/usr/share/vdradmin/
done

# extra support tools
install -m 755 contrib/at2epgsearch $RPM_BUILD_ROOT/usr/share/vdradmin/
perl -pi -e "s#vdradmin-am#vdradmin#g" $RPM_BUILD_ROOT/usr/share/vdradmin/at2epgsearch


# create adjusted default config with random password
cat <<END | $RPM_BUILD_ROOT/usr/sbin/vdradmind -d $RPM_BUILD_ROOT/etc/vdradmin -c
localhost
6419
0.0.0.0
8001
vdradmin
vdradmin-$RANDOM-$RANDOM
/var/lib/vdr/video
/etc/vdr
END

# fix default EPGIMAGES location
perl -pi -e "s#^(EPGIMAGES =).*#\1 /var/lib/vdr/video/epgimages#g" $RPM_BUILD_ROOT/etc/vdradmin/vdradmind.conf

# default logging to syslog
perl -pi -e "s#^(LOGFILE =).*#\1 syslog#g" $RPM_BUILD_ROOT/etc/vdradmin/vdradmind.conf

# default log level notice
perl -pi -e "s#^(LOGLEVEL =).*#\1 5#g" $RPM_BUILD_ROOT/etc/vdradmin/vdradmind.conf

# random default guest password
guestpass="guest-$RANDOM-$RANDOM"
perl -pi -e "s#^(PASSWORD_GUEST =).*#\1 $guestpass#g" $RPM_BUILD_ROOT/etc/vdradmin/vdradmind.conf


# sysconfig
install -m 644 contrib/vdradmin.sysconfig $RPM_BUILD_ROOT/etc/sysconfig/vdradmin


%pre
# ensure that user and group exist
if ! getent group %{vdradmin_group} >/dev/null; then
    echo -n "Adding group %{vdradmin_group}.."
    groupadd --system %{vdradmin_group}
    echo "..done"
fi
if ! getent passwd %{vdradmin_user} >/dev/null; then
    echo -n "Adding user %{vdradmin_user}.."
    useradd --system --home /var/lib/vdradmin --shell /bin/false \
      --comment "VDRAdmin user" --no-create-home \
      --gid %{vdradmin_group} \
      %{vdradmin_user}
    echo "...done"
fi



%post
#!/bin/sh -e
set -e

# ensure vdradmind.at (auto timers) exists
ATFILE=/var/lib/vdradmin/vdradmind.at
[ -e $ATFILE ] || touch $ATFILE

systemctl daemon-reload

if [ "$1" = "2" ]; then
	# upgrade
	systemctl condrestart vdradmin
fi

if [ "$1" = "1" ]; then
	# install
	echo "Check for default passwords in /etc/vdradmin/vdradmind.conf:"
	echo "$ egrep '^(USERNAME|PASSWORD)' /etc/vdradmin/vdradmind.conf"
fi


%preun
#!/bin/sh
set -e

if [ "$1" = "0" ]; then
	# uninstall
	systemctl disable --now vdradmin
fi


%postun

if [ "$1" = "0" ]; then
	if getent passwd %{vdradmin_user} >/dev/null; then
        	userdel %{vdradmin_user} || true
	fi
	if getent group %{vdradmin_group} >/dev/null; then
        	groupdel %{vdradmin_group} || true
	fi
fi


%files

%config(noreplace) /etc/sysconfig/vdradmin

%attr(0755,root,root) /usr/sbin/vdradmind

/usr/share/doc/vdradmin
/usr/share/vdradmin/template

%dir %attr(0770,root,vdradmin) /var/cache/vdradmin/
%dir %attr(0770,root,vdradmin) /var/lib/vdradmin/
%dir %attr(0770,root,vdradmin) /var/log/vdradmin/

%dir %attr(0750,root,vdradmin) /etc/vdradmin/certs
%dir %attr(0750,vdradmin,video) /etc/vdradmin/

%config(noreplace) %attr(0640,vdradmin,video) /etc/vdradmin/vdradmind.conf

%attr(0755,root,root) /usr/share/vdradmin/at2epgsearch
%attr(0755,root,root) /usr/share/vdradmin/autotimer2searchtimer.pl
%attr(0755,root,root) /usr/share/vdradmin/convert.pl

/usr/lib/systemd/system/

%dir %doc /usr/share/doc

/usr/share/locale
/usr/share/man
/usr/share/vdradmin/lib


%changelog
* Fri Feb 03 2023 Peter Bieringer <pb@bieringer.de> - 3.6.10-5.1
- Create spec based on converted from vdradmin-am_3.6.10-4.1_all.deb by alien version 8.95
- Extend/adjust spec and file locations
- Add systemd unit and sysconfig file
