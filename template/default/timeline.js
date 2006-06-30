/*##########################################################################*/
/* Utility functions                                                        */
/*##########################################################################*/
function W(s)
{
   document.write(s);
}

function Div(x, y)
{
   return (x - x % y) / y;
}

function Translation(_now, _o_clock, _to, 
                     _sunday, _monday, _tuesday, _wednesday, 
                     _thursday, _friday, _saturday)
{
   this.now = _now;
   this.o_clock = _o_clock;
   this.to = _to;
   this.week_day = new Array(_sunday, _monday, _tuesday, _wednesday, 
                             _thursday, _friday, _saturday);
}

function ChannelInfo(vdr_id, name, url, events)
{
   this.vdr_id = vdr_id;
   this.name = name;
   this.url = url;
   this.events = events;
}

function EPGEvent(epg_id, start_sec, stop_sec, title, timer, summary)
{
   this.epg_id = epg_id;
   this.start_sec = start_sec;
   this.stop_sec = stop_sec;
   this.start_str = format_date('%H:%M', start_sec);
   this.stop_str = format_date('%H:%M', stop_sec);
   this.title = title;
   this.timer = timer;
   this.summary = summary;
}

function format_date(fmt, time)
{	
   var date = new Date(time * 1000);
   switch (fmt)
   {
      case "%H:%M":
      {
         var h = '0' + date.getHours();
         var m = '0' + date.getMinutes();
         return h.substr(h.length-2, 2) + ':' + m.substr(m.length-2, 2);
      }
      case "%A, %H:%M":
      {
         var d = trans.week_day[date.getDay()];
         var h = '0' + date.getHours();
         var m = '0' + date.getMinutes();
         return d + ", " + h.substr(h.length-2, 2) + ':' + m.substr(m.length-2, 2);
      }
   }
   return "[WRONG_FMT:" + fmt + "]";
}

function TimeLine(_req_sec, _now_url, _px_per_min, _end_min)
{
   this.now_url = _now_url;
   
   this.name_w = 100;
   var tab = document.getElementById("heading");
   if (tab)
   {
      this.table_w = tab.clientWidth;
   }
   else
   {
      this.table_w = this.innerWidth - 8;
   }
//   this.px_per_min = _px_per_min;
	 
	 this.table_w10 = Div(this.table_w, 10);
	 my_min = this.table_w10 < 100 ? 100 : this.table_w10;
	 this.px_per_min = Div((this.table_w - my_min), _end_min);
   
//   this.end_min = Div(this.table_w - this.name_w, this.px_per_min);
//   if (this.end_min > _end_min)
//   {
      this.end_min = _end_min;
//   }
   this.end_min -= this.end_min % 30;
   this.event_w = this.end_min * this.px_per_min;
   this.name_w = this.table_w - this.event_w;
   this.min5_h = 10;
   
   var d = new Date();
   this.now_sec = Div(d.getTime(), 1000);
   
   this.req_sec = _req_sec;
   this.start_sec = _req_sec - _req_sec % 1800;
   this.end_sec = this.start_sec + this.end_min * 60;
   
   this.first_sec = this.now_sec + 1799 - this.end_min * 60;
   this.first_sec -= this.first_sec % 1800;
   this.last_sec = this.first_sec + 86400;
}


/*##########################################################################*/
/* Build the HTML code                                                      */
/*##########################################################################*/
function BuildContent()
{
   W('<div id="content">');
   
      W('<table width="' + tl.table_w + '" border="0" cellspacing="0" cellpadding="0" class="bigtable list">');
         BuildHeader();
         BuildTable();
      W('</table>');
   
      DrawTimeLine();
   W('</div>');
}

function BuildHeader()
{
   W('<tr class="heading">');
      W('<td id="header_title" colspan="3">');
         W('<h2>');
            W(format_date('%A, %H:%M', tl.start_sec) + '&nbsp;' + trans.o_clock 
              + '&nbsp;' + trans.to + '&nbsp;' 
              + format_date('%H:%M', tl.end_sec) + '&nbsp;' + trans.o_clock);
         W('</h2>');
         W('<br/>');
      W('</td>');
      W('<td id="header_navi" class="col_navi">');
      if (tl.start_sec < tl.first_sec + 1800)
      {
         W('<img src="bilder/pfeile_nachlinks_soft.png" border="0" />');
      }
      else
      {
         var diff_sec = tl.start_sec - tl.end_min * 60;
         if (diff_sec < tl.first_sec)
         {
            diff_sec = tl.first_sec;
         }
         W('<a href="' + tl.now_url + '&amp;time=' + format_date('%H:%M', diff_sec) + '">');
            W('<img src="bilder/pfeile_nachlinks.png" border="0" />');
         W('</a>');
      }
      if (tl.end_sec > tl.last_sec - 1800)
      {
         W('<img src="bilder/pfeile_nachrechts_soft.png" border="0" />');
      }
      else
      {
         var diff_sec = tl.end_sec;
         if (diff_sec > tl.last_sec - tl.end_min * 60 - 1800)
         {
            diff_sec = tl.last_sec - tl.end_min * 60;
         }
         W('<a href="' + tl.now_url + '&amp;time=' + format_date('%H:%M', diff_sec) + '">');
            W('<img src="bilder/pfeile_nachrechts.png" border="0" />');
         W('</a>');
      }
      W('</td>');
   W('</tr>');
}

function BuildTable()
{
   W('<tr id="row_timeline" class="row_even">');
      W('<td colspan="4">');
         BuildTimeScale();
         BuildProgTable();
      W('</td>');
   W('</tr>');
}

function BuildTimeScale()
{
   W('<table width="' + tl.table_w + '" border="0" cellspacing="0" cellpadding="0" class="timestable">');
      W('<tr>');
         W('<td><img src="bilder/spacer.gif" width="' + tl.name_w + '" height="1" border="0" /></td>');
         for (var min = 0; min < tl.end_min; min += 30)
         {
            var c = min % 60 ? 'color1' : 'color2';
            var w = tl.px_per_min * (tl.end_min - min < 30) ? tl.end_min - min : 30;
            var t = tl.start_sec + min * 60;
            W('<td colspan="6" class="' + c + '">');
               W('<img src="bilder/spacer.gif" width="' + w + '" height="1" border="0" /><br/>');
               W('<span class="date_time">' + format_date('%H:%M', t) + '</span>');
            W('</td>');
         }
      W('</tr>');
      W('<tr>');
         W('<td><img src="bilder/spacer.gif" width="' + tl.name_w + '" height="1" border="0" /></td>');
         for (var min = 0; min < tl.end_min; min += 5)
         {
            var c = min % 10 ? 'color1' : 'color2';
            var w = tl.px_per_min * 5;
            W('<td width="' + tl.px_per_min + '" height="' + tl.min5_h + '" class="' + c + '">');
               W('<img src="bilder/spacer.gif" width="' + w + '" height="1" border="0" /><br/>');
            W('</td>');
         }
      W('</tr>');
   W('</table>');
}

function BuildProgTable()
{
   W('<table border="0" cellpadding="0" cellspacing="0" width="' + tl.table_w + '" class="prgname">');
      for (var i = 0; i < channels.length; i++)
      {
         var c = "prgname " + (i % 2 ? "color1" : "color2");
         BuildChannel(channels[i], c);
      }
   W('</table>');
}

function BuildChannel(channel, td_class)
{
   W('<tr>');
      /* Channel name */
      W('<td width="' + tl.name_w + '" class="' + td_class + '">');
         W('<img src="bilder/spacer.gif" width="' + tl.name_w + '" height="1" border="0"/><br/>');
         W('<nobr>');
            W('<a href="' + channel.url + '" class="channel_name">');
               W(channel.name);
            W('</a>');
         W('</nobr>');
      W('</td>');
      
      /* Events */
      W('<td class="' + td_class + '">');
         W('<nobr>');
         var old_stop_min = 0;
         for (var i = 0; i < channel.events.length; i++)
         {
            var event = channel.events[i];
            
            /* Calculate event start and stop time in minutes from table begin. */
            var start_min = Div(event.start_sec - tl.start_sec, 60);
            var stop_min = Div(event.stop_sec - tl.start_sec, 60);
            if (start_min >= tl.end_min) break;
   
            /* Adjust times to regard end of last event and end of table. */
            td_class = "";
            if (start_min < old_stop_min)
            {
               start_min = old_stop_min;
					if (start_min > 0)
					{
						td_class = "color_spacer"; /* overlapped event */
					}
            }
            if (stop_min > tl.end_min) stop_min = tl.end_min;
   
            /* Ignore completely overlapped events. */
            if (start_min >= stop_min) continue;
   
            if (!td_class)
            {
               if (event.timer)
               {
                  td_class = "color_timer";
               }
               else if ((event.start_sec <= tl.now_sec) && (tl.now_sec < event.stop_sec))
               {
                  td_class = "color_current";
               }
               else
               {
                  td_class = "color_broadcast";
               }
            }
            
            if (start_min  > old_stop_min + 1)
            {
               BuildSpacer((start_min - old_stop_min) * tl.px_per_min);
            }
            
            var px_w = (stop_min - start_min) * tl.px_per_min;
            BuildEvent(channel.vdr_id, i, event, td_class, px_w);
            old_stop_min = stop_min;
         }
         W('</nobr>');
      W('</td>');
   W('</tr>');
}

function BuildSpacer(width)
{
   W('<table border="0" align="left" cellpadding="0" cellspacing="0" width="' + width + '" class="prgtable">');
      W('<tr>');
         W('<td width="1" class="color_spacer">');
            W('<img src="bilder/spacer.gif" width="1" height="1" border="0"/><br/>');
            W('<nobr>');
               W('<img src="bilder/spacer.gif" width="1" height="8" border="0"/>');
            W('</nobr>');
         W('</td>');
      W('</tr>');
   W('</table>');
}

function BuildEvent(vdr_id, counter, event, td_class, px_w)
{
   var table_class = event.timer ? "timertable" : "prgtable";
   W('<table border="0" align="left" cellpadding="0" cellspacing="0" width="' + px_w + '" class="' + table_class + '">');
      W('<tr>');
         W('<td width="1" class="' + td_class + '" ');
         if (show_tooltips)
         {
            W('onMouseOver="tip(' + "'VDR-" + vdr_id + "-" + counter + "'); " + 'return true;" ');
            W('onMouseOut="untip(); return true;" ');
         }
         W('>');
            W('<img src="bilder/spacer.gif" width="1" height="1" border="0" /><br />');
            W('<nobr>');
               var anchor_start = "";
               var anchor_end = "";
               if (event.summary)
               {
                  anchor_start = '<a href="javascript:popup(' 
                               + "'./vdradmin.pl?aktion=prog_detail&amp;epg_id=" 
						             + event.epg_id + "&amp;vdr_id=" + vdr_id + "');" + '">';
                  anchor_end = '</a>';
               }
               W(anchor_start);
                  W(event.title);
               W(anchor_end);
            W('</nobr>');
         W('</td>');
      W('</tr>');
   W('</table>');
}

function DrawTimeLine()
{
   var tab = document.getElementById("row_timeline");
   if (tab && (tl.start_sec <= tl.now_sec) && (tl.now_sec < tl.end_sec))
   {
      var x = tl.name_w + tl.px_per_min * Div(tl.now_sec - tl.start_sec, 60) + 1;
      var y = tab.offsetTop;
      var h = tab.offsetHeight;
      var style = "position:absolute; "
                + "top:" + y + "px; "
                + "left:" + x + "px; "
                + "width:1px; "
                + "height:" + h + "px; "
                + "z-index:2; ";
      if (document.all)
      {
         style = style + "filter:Alpha(opacity=50); ";
      }

      W('<span id="timeline" style="' + style + '">');
      W('   <img src="bilder/spacer.gif" width="1" height="1" border="0" />');
      W('</span>');
   }
}
