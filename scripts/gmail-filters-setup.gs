/**
 * Gmail Filters Setup for 3headedm@gmail.com
 * Updated: Unified Inbox System — Zoho, Social, Priority routing
 *
 * HOW TO USE:
 * 1. Go to https://script.google.com while logged into 3headedm@gmail.com
 * 2. Click "New project"
 * 3. Delete whatever is in the editor
 * 4. Paste this entire file
 * 5. Click "Services" (+) on the left, add "Gmail API"
 * 6. Click "Run" (play button) — select "createAllFilters" if prompted
 * 7. Authorize when prompted (click Advanced > Go to Untitled project)
 * 8. Check the Execution log for results
 * 9. Done. Delete the project after if you want.
 */

function createAllFilters() {
  // Ensure all labels exist
  var labelNames = [
    // Agent labels (existing)
    'Stone', 'Cardinal', 'Chaos',
    // Priority labels (existing)
    'P0-Critical', 'P1-High', 'P2-Medium', 'P3-Routine',
    // Zoho labels
    'Zoho/Admin', 'Zoho/Support', 'Zoho/Security', 'Zoho/Legal', 'Zoho/Enterprise',
    // Social labels
    'Social/Twitter', 'Social/LinkedIn', 'Social/Instagram',
    'Social/TikTok', 'Social/YouTube', 'Social/Discord',
    'Social/Reddit', 'Social/Facebook',
    // Business labels
    'Business/StoneAI', 'Business/BestAI', 'Business/StoneAITools',
    // Status labels
    'Status/Action-Required', 'Status/Handled', 'Status/Awaiting-Response'
  ];

  labelNames.forEach(function(name) {
    var label = GmailApp.getUserLabelByName(name);
    if (!label) {
      label = GmailApp.createLabel(name);
      Logger.log('Created label: ' + name);
    } else {
      Logger.log('Label already exists: ' + name);
    }
  });

  // Get all Gmail labels with their IDs via the API
  var allLabels = Gmail.Users.Labels.list('me').labels;
  var labelIdMap = {};
  allLabels.forEach(function(l) {
    labelIdMap[l.name] = l.id;
  });

  Logger.log('Label ID map built: ' + Object.keys(labelIdMap).length + ' labels');

  // System label IDs
  var STARRED = 'STARRED';
  var IMPORTANT = 'IMPORTANT';

  // --- FILTER DEFINITIONS ---
  var filters = [
    // =========================================
    // PRIORITY FILTERS (existing)
    // =========================================
    {
      criteria: { query: 'subject:([P0])' },
      labelName: 'P0-Critical'
    },
    {
      criteria: { query: 'subject:([P1])' },
      labelName: 'P1-High'
    },
    {
      criteria: { query: 'subject:([P2])' },
      labelName: 'P2-Medium'
    },
    {
      criteria: { query: 'subject:([P3])' },
      labelName: 'P3-Routine'
    },

    // =========================================
    // AGENT FILTERS (existing)
    // =========================================
    {
      criteria: { query: 'subject:(Stone) OR subject:([Stone])' },
      labelName: 'Stone'
    },
    {
      criteria: { query: 'subject:(Cardinal) OR subject:([Cardinal])' },
      labelName: 'Cardinal'
    },
    {
      criteria: { query: 'subject:(Chaos) OR subject:([Chaos])' },
      labelName: 'Chaos'
    },

    // =========================================
    // ZOHO ROUTING (by subject tag)
    // =========================================
    {
      criteria: { query: 'subject:([ADMIN])' },
      labelNames: ['Zoho/Admin', 'Stone']
    },
    {
      criteria: { query: 'subject:([SUPPORT])' },
      labelNames: ['Zoho/Support', 'Stone']
    },
    {
      criteria: { query: 'subject:([SECURITY])' },
      labelNames: ['Zoho/Security', 'Cardinal']
    },
    {
      criteria: { query: 'subject:([LEGAL])' },
      labelNames: ['Zoho/Legal', 'Cardinal']
    },
    {
      criteria: { query: 'subject:([ENTERPRISE])' },
      labelNames: ['Zoho/Enterprise', 'Stone']
    },

    // =========================================
    // SOCIAL MEDIA ROUTING (by sender)
    // =========================================
    {
      criteria: { from: 'notify@twitter.com OR info@twitter.com OR notify@x.com OR info@x.com' },
      labelName: 'Social/Twitter'
    },
    {
      criteria: { from: 'notifications@linkedin.com' },
      labelName: 'Social/LinkedIn'
    },
    {
      criteria: { from: 'no-reply@mail.instagram.com' },
      labelName: 'Social/Instagram'
    },
    {
      criteria: { from: 'noreply@youtube.com' },
      labelName: 'Social/YouTube'
    },
    {
      criteria: { from: 'noreply@discord.com' },
      labelName: 'Social/Discord'
    },
    {
      criteria: { from: 'noreply@reddit.com OR noreply@redditmail.com' },
      labelName: 'Social/Reddit'
    },
    {
      criteria: { from: 'notification@facebookmail.com OR noreply@facebookmail.com' },
      labelName: 'Social/Facebook'
    },
    {
      criteria: { from: 'no-reply@tiktok.com' },
      labelName: 'Social/TikTok'
    },

    // =========================================
    // PRIORITY KEYWORD ESCALATION
    // P0: Star + mark important + P0-Critical + Action-Required
    // =========================================
    {
      criteria: { query: 'subject:(urgent OR emergency OR breach OR lawsuit OR subpoena OR "cease and desist" OR "critical outage" OR "data leak")' },
      labelNames: ['P0-Critical', 'Status/Action-Required'],
      star: true,
      important: true
    },
    // P1: Star + P1-High + Action-Required
    {
      criteria: { query: 'subject:("high priority" OR "action required" OR escalat OR "sla breach" OR "revenue drop" OR "churn spike" OR "security incident")' },
      labelNames: ['P1-High', 'Status/Action-Required'],
      star: true,
      important: true
    },

    // =========================================
    // BUSINESS ROUTING (by sender domain)
    // =========================================
    {
      criteria: { from: '*@stone-ai.net' },
      labelName: 'Business/StoneAI'
    },
    {
      criteria: { query: 'subject:(Best AI) OR subject:("Best AI")' },
      labelName: 'Business/BestAI'
    },
    {
      criteria: { query: 'subject:(Stone AI Tools) OR subject:("tools.stone-ai.net")' },
      labelName: 'Business/StoneAITools'
    }
  ];

  // Create each filter
  filters.forEach(function(f) {
    var addLabelIds = [];

    // Handle single labelName or multiple labelNames
    var names = f.labelNames || [f.labelName];
    var missingLabel = false;

    names.forEach(function(name) {
      var id = labelIdMap[name];
      if (!id) {
        Logger.log('WARNING: Could not find label ID for ' + name + '. Skipping filter.');
        missingLabel = true;
      } else {
        addLabelIds.push(id);
      }
    });

    if (missingLabel && addLabelIds.length === 0) return;

    // Add system labels for priority escalation
    if (f.star) addLabelIds.push(STARRED);
    if (f.important) addLabelIds.push(IMPORTANT);

    var filterResource = {
      criteria: f.criteria,
      action: {
        addLabelIds: addLabelIds,
        removeLabelIds: []
      }
    };

    try {
      Gmail.Users.Settings.Filters.create(filterResource, 'me');
      Logger.log('Created filter: ' + JSON.stringify(f.criteria) + ' -> ' + names.join(', '));
    } catch (e) {
      Logger.log('Error creating filter for ' + names.join(', ') + ': ' + e.message);
    }
  });

  Logger.log('--- DONE. All filters processed. ---');
}
