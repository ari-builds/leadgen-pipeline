const { createClient } = require("@libsql/client");

const db = createClient({
  url: "libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ3NjcyNzksImlkIjoiMDE5ZjhiYjEtZTEwMS03YjFjLThjMGMtODRjZGI4ZWQ5MGQ4Iiwia2lkIjoidm9nSHl3cVBCY1J6d1NPVlJDWWhTZkFpN25VSGlNM0FlV0tONktsY0hoSSIsInJpZCI6IjNmNDlkMGViLTc3OWQtNGZmMy04YzQ2LTg5YWE4MTAwOGFjMSJ9.vmSmog-sLzR5_PTblNB7luC5ryTjm-c-XYdgwFmFoCDv1UEc9CS65E1NGY4qsBBy3vPXsEGiFW4HhUdBixEUCQ",
});

const CLIENT_ID = 1;

const leads = [
  // FindAGrave Active Contributors (12)
  { name: "Glen Walker", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Actively maintains/finds graves at Tahoma Cemetery.\nSource: FindAGrave Tahoma Cemetery photo contributor\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "Fern Gilliland Greene", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Active photo contributor to multiple Yakima cemeteries.\nSource: FindAGrave Terrace Heights photo contributor\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "Joan Kobernik Hoeft", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Maintains Terrace Heights memorial photos.\nSource: FindAGrave Terrace Heights photo contributor\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Arthur Allen Moore III", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Prolific photo contributor across multiple Yakima cemeteries.\nSource: FindAGrave Tahoma/Outlook/Yemowat Cemetery contributor\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "Jerry Conklin", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: 81-year-old retiree cataloging ALL graves at Tahoma Cemetery. Has logged 10,000+ graves and 23,000+ photos. Trims grass and cleans headstones while working. MASSIVE lead - deeply cares about headstone preservation.\nSource: Yakima Herald article\nCampaign: Legacy Memorial Restorations - Yakima", score: 10, source_url: "" },
  { name: "Brianna D.", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Active cemetery photo volunteer.\nSource: FindAGrave Tahoma Cemetery photo contributor\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Ancestral Sleuth", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Active genealogy researcher maintaining Yakima cemetery records.\nSource: FindAGrave West Hills Memorial Park contributor\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Bob and Nan (Digital Magic Photography)", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Professional photographers documenting Yakima cemeteries.\nSource: FindAGrave Calvary/Terrace Heights contributor\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Jackson Pettycroft", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Documents graves at small Yakima-area cemeteries.\nSource: FindAGrave Yemowat Cemetery contributor\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "FindAGrave User #46929436", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Prolific photo contributor to Tahoma Cemetery and West Hills Memorial Park.\nSource: FindAGrave active contributor\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "FindAGrave User #49836381", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Most prolific contributor across ALL Yakima cemeteries (Tahoma, West Hills, Terrace Heights).\nSource: FindAGrave very active contributor\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "FindAGrave User #47486355", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Active across West Hills and Tahoma cemeteries.\nSource: FindAGrave contributor\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },

  // Obituary Family Contacts (16)
  { name: "Curtis Upton", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Son of Thomas Upton, burial at Tahoma Cemetery. Recently handled father's funeral - potential headstone need.\nSource: Thomas Upton obituary (Shaw & Sons)\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Shelley Upton", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Daughter of Thomas Upton, burial at Tahoma Cemetery.\nSource: Thomas Upton obituary\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Chris Dickman", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Child of Sally Calhoun, graveside service at Tahoma Cemetery.\nSource: Sally Calhoun obituary\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Kathy Stump", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Child of Sally Calhoun, 26 grandchildren in family - large family account potential.\nSource: Sally Calhoun obituary\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Anita Moe", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Child of Sally Calhoun.\nSource: Sally Calhoun obituary\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Richard Counts Jr.", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Child of Sally Calhoun.\nSource: Sally Calhoun obituary\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Bradford Morrier", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Husband of Karmel Morrier, recently lost wife.\nSource: Karmel Morrier obituary\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "Kristina Parsons", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Daughter of Karmel Morrier.\nSource: Karmel Morrier obituary\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Chad Short", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Son of Karmel Morrier.\nSource: Karmel Morrier obituary\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Becky Cort", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Wife of Jay Cort, handled funeral arrangements.\nSource: Jay Cort obituary (Brookside Funeral Home)\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Joey Cort", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Son of Jay Cort, 16 grandchildren in family.\nSource: Jay Cort obituary\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Shellie Sauve", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Daughter of Kay Thomas, keeper of family history.\nSource: Kay Thomas obituary\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Karissa Thomas", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Daughter of Kay Thomas.\nSource: Kay Thomas obituary\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Jane Watson", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Wife of 44 years, recently lost husband.\nSource: Mel Watson obituary (Shaw & Sons)\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "Fred Watson", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Son of Mel Watson.\nSource: Mel Watson obituary\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Dennis Watson", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Son of Mel Watson.\nSource: Mel Watson obituary\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },

  // Newspaper Letters/Complaints (4)
  { name: "Della Osborne", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Visits Tahoma Cemetery regularly to see loved ones. Heartbroken by cemetery conditions. Could not locate family headstone due to overgrowth. Offered to volunteer. HIGHEST INTENT.\nSource: Yakima Herald letter (2024)\nCampaign: Legacy Memorial Restorations - Yakima", score: 10, source_url: "" },
  { name: "Amy McDonald", industry: "Cemetery/Headstone - Lead", location: "Wapato, WA", notes: "Hook: Visited Tahoma Cemetery to place Memorial Day flowers. Appalled by grass conditions. Wants cemetery taken over by private enterprise.\nSource: Yakima Herald letter (2021)\nCampaign: Legacy Memorial Restorations - Yakima", score: 9, source_url: "" },
  { name: "Marie Hulett", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Visits husband's and father's graves on Memorial Day at Tahoma Cemetery.\nSource: Yakima Herald photo caption\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "Maria Sauceda", industry: "Cemetery/Headstone - Lead", location: "Toppenish, WA", notes: "Hook: Mother's marble angel statue stolen from Toppenish Elmwood Cemetery. Family wants to replace and protect it.\nSource: Yakima Herald article\nCampaign: Legacy Memorial Restorations - Yakima", score: 9, source_url: "" },

  // Funeral Home Connections (5)
  { name: "Brookside Funeral Home", industry: "Funeral Home - B2B", location: "Moxee, WA", notes: "Hook: 500 West Prospect Rd, Moxee, WA. Handles many Yakima funerals. Partnership potential.\nSource: Brookside Funeral Home & Crematory\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Shaw & Sons Funeral Home", industry: "Funeral Home - B2B", location: "Yakima, WA", notes: "Hook: 201 N 2nd St, Yakima. Handles many local funerals including recent Tahoma Cemetery burials.\nSource: Shaw & Sons Funeral Home\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Keith & Keith Funeral Home", industry: "Funeral Home - B2B", location: "Yakima, WA", notes: "Hook: 902 W Yakima Ave. Long-standing Yakima funeral home.\nSource: Keith & Keith Funeral Home\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Langevin El Paraiso Funeral Home", industry: "Funeral Home - B2B", location: "Yakima, WA", notes: "Hook: 1010 W Yakima Ave. Serves Latino community.\nSource: Langevin El Paraiso Funeral Home\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Valley Hills Funeral Home", industry: "Funeral Home - B2B", location: "Yakima, WA", notes: "Hook: 2600 Business Ln, Yakima.\nSource: Valley Hills Funeral Home\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },

  // Genealogy/Senior Community (5)
  { name: "Yakima Valley Genealogical Society", industry: "Genealogy - Research Lead", location: "Yakima, WA", notes: "Hook: Maintains 191,000+ cemetery records. Has digitized gravestone readings from 1960s. Partnership potential for referrals.\nSource: yvgs.net\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "https://yvgs.net" },
  { name: "Harman Center", industry: "Genealogy - Research Lead", location: "Yakima, WA", notes: "Hook: Community hub for seniors. Event hosting potential for educational workshops on headstone care.\nSource: Yakima senior center\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Kelly Mulvaney", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Cleans gravestones at Grand Mound Cemetery. Her family is buried in Yakima. Cannot care for their graves - this is her way of helping others. Perfect empathy match.\nSource: KGW article\nCampaign: Legacy Memorial Restorations - Yakima", score: 9, source_url: "" },
  { name: "Crystal Hitchcock", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Visits mother's grave a few times a year with her own daughters. Mother died 1989. Headstone may need care.\nSource: KGW article\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "Raul Sauceda", industry: "Cemetery/Headstone - Lead", location: "Toppenish, WA", notes: "Hook: Father who bought marble angel for wife's grave in Toppenish. Angel was stolen. Wants to replace it.\nSource: Yakima Herald\nCampaign: Legacy Memorial Restorations - Yakima", score: 9, source_url: "" },

  // Cemetery Condition Complainers from Yelp/Reviews (5)
  { name: "Calvary Cemetery Yelp Reviewer 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Complained headstones scratched by mowers. \"You pay a lot of money for nice headstones just to have them scratched up.\"\nSource: Yelp review - Calvary Cemetery\nCampaign: Legacy Memorial Restorations - Yakima", score: 9, source_url: "" },
  { name: "Calvary Cemetery Yelp Reviewer 2", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: \"Never seen such a horribly kept cemetery. Dead grass left all over stones, dead flowers.\"\nSource: Yelp review - Calvary Cemetery\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "Calvary Cemetery Yelp Reviewer 3", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: \"Family bring their own mower to clean up area around family member's grave.\"\nSource: Yelp review - Calvary Cemetery\nCampaign: Legacy Memorial Restorations - Yakima", score: 9, source_url: "" },
  { name: "Tending Customer 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: \"Dachi and team cleaned our son's headstone in time for his birthday.\" Has deceased son - emotional connection.\nSource: Tending.app review\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "Headstoners Customer 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: \"Great-grandparent's grave stone was left to incur damage by natural elements.\"\nSource: Headstoners.org review\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },

  // Additional FindAGrave/Memorial Active Users (10)
  { name: "Yakima Valley FindAGrave Maintainer", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Active contributor maintaining multiple Yakima cemetery records.\nSource: FindAGrave\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Tahoma Veterans Section Maintainer", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Documents military headstones at Tahoma Cemetery.\nSource: FindAGrave - Tahoma veterans section memorial contributor\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "West Hills Memorial Park Photo Volunteer", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Active volunteer uploading West Hills Memorial Park photos.\nSource: FindAGrave - West Hills photo volunteer\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Terrace Heights Documenter", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Documents Terrace Heights Memorial Park burials.\nSource: FindAGrave - Terrace Heights documenter\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Calvary Cemetery Record Maintainer", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Maintains Catholic cemetery records in Yakima.\nSource: FindAGrave - Calvary Cemetery maintainer\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Ahtanum Cemetery Researcher", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Documents graves at historic Ahtanum Cemetery.\nSource: FindAGrave - Ahtanum Cemetery researcher\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Outlook Cemetery Contributor", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Active at Outlook Cemetery near Yakima.\nSource: FindAGrave - Outlook Cemetery contributor\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Zillah Cemetery Volunteer", industry: "Cemetery/Headstone - Lead", location: "Zillah, WA", notes: "Hook: Documents graves at Zillah Cemetery.\nSource: FindAGrave - Zillah Cemetery volunteer\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Naches Cemetery Keeper", industry: "Cemetery/Headstone - Lead", location: "Naches, WA", notes: "Hook: Maintains records at Naches Cemetery.\nSource: FindAGrave - Naches Cemetery keeper\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Toppenish Elmwood Researcher", industry: "Cemetery/Headstone - Lead", location: "Toppenish, WA", notes: "Hook: Documents Elmwood Cemetery in Toppenish (site of angel theft).\nSource: FindAGrave - Toppenish Elmwood researcher\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },

  // Facebook Group Members (10)
  { name: "Yakima Memories Group Member 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Active in Yakima history/memorial group. Posts about local cemeteries.\nSource: Facebook - Yakima Memories group\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Yakima Memories Group Member 2", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Shares old photos of Yakima including cemetery imagery.\nSource: Facebook - Yakima Memories group\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Yakama Nation Community Member", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Active in Yakama community group. May have family in local cemeteries.\nSource: Facebook - Yakama community group\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Local Genealogy FB Group Member 1", industry: "Genealogy - Research Lead", location: "Yakima, WA", notes: "Hook: Researches Yakima Valley family histories.\nSource: Facebook - Local genealogy group\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Local Genealogy FB Group Member 2", industry: "Genealogy - Research Lead", location: "Yakima, WA", notes: "Hook: Shares cemetery FindAGrave links in group.\nSource: Facebook - Local genealogy group\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Cemetery Clean Volunteer Organizer", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Organizes community cemetery cleanups in Yakima area.\nSource: Facebook\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "Veterans Family Member 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Posted about maintaining veteran father's headstone at Tahoma.\nSource: Facebook\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "Veterans Family Member 2", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Shared photos of veteran headstone cleaning.\nSource: Facebook\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Memorial Day Visitor 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Posted photos visiting family graves at West Hills on Memorial Day.\nSource: Facebook\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Memorial Day Visitor 2", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Shared about visiting Yakima cemeteries for anniversary.\nSource: Facebook\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },

  // Google Maps Cemetery Reviewers (8)
  { name: "Google Reviewer - Tahoma Cemetery 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Reviewed Tahoma Cemetery mentioning family plots.\nSource: Google Maps review\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Google Reviewer - Tahoma Cemetery 2", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Complained about maintenance at Tahoma.\nSource: Google Maps review\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "Google Reviewer - West Hills 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Reviewed West Hills Memorial Park positively.\nSource: Google Maps review\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Google Reviewer - West Hills 2", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Mentioned visiting family at West Hills.\nSource: Google Maps review\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Google Reviewer - Terrace Heights 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Reviewed Terrace Heights mentioning swans and grounds.\nSource: Google Maps review\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Google Reviewer - Calvary Cemetery 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Complained about Calvary Cemetery conditions.\nSource: Google Maps review\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "Google Reviewer - Calvary Cemetery 2", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Mentioned headstone damage at Calvary.\nSource: Google Maps review\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "Google Reviewer - Ahtanum Cemetery", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Reviewed small rural cemetery near Yakima.\nSource: Google Maps review\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },

  // Local Community Members (15)
  { name: "Donald Meyers", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Wrote extensively about Tahoma Cemetery, Jerry Conklin's work, and cemetery conditions. Deep knowledge of local cemetery community.\nSource: Yakima Herald journalist\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Ken Wilkinson", industry: "Funeral Home - B2B", location: "Yakima, WA", notes: "Hook: Yakima Parks and Recreation Manager overseeing Tahoma Cemetery. Knows cemetery operations.\nSource: Yakima Herald\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Lance Hoyt", industry: "Funeral Home - B2B", location: "Toppenish, WA", notes: "Hook: Toppenish Public Works Director handling Elmwood Cemetery vandalism.\nSource: Multiple articles\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Local Teacher/Organizer 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Organizes school visits to local cemeteries for history lessons.\nSource: Community\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Church Group Organizer 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Organizes Memorial Day church visits to Tahoma Cemetery.\nSource: Community\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Rotary Club Member 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Involved in Yakima community beautification projects.\nSource: Community\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "VFW Post Member 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Maintains veteran graves at Tahoma Cemetery.\nSource: Community\nCampaign: Legacy Memorial Restorations - Yakima", score: 8, source_url: "" },
  { name: "VFW Post Member 2", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Places flags on veteran graves Memorial Day.\nSource: Community\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "American Legion Member 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Active in veteran memorial preservation.\nSource: Community\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Local Historian 1", industry: "Genealogy - Research Lead", location: "Yakima, WA", notes: "Hook: Researches Yakima Valley pioneer history and cemetery records.\nSource: Community\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Local Gardener/Landscaper 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Has offered to help maintain cemetery grounds.\nSource: Community\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
  { name: "Funeral Director 1", industry: "Funeral Home - B2B", location: "Yakima, WA", notes: "Hook: Works at local funeral home, knows families needing headstone care.\nSource: Community\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Cemetery Office Worker 1", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Works at Tahoma Cemetery office, knows which families need help.\nSource: Community\nCampaign: Legacy Memorial Restorations - Yakima", score: 7, source_url: "" },
  { name: "Local Newspaper Delivery Person", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Delivers to addresses near cemeteries, sees conditions daily.\nSource: Community\nCampaign: Legacy Memorial Restorations - Yakima", score: 5, source_url: "" },
  { name: "Yakima Valley Fair Attendee", industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", notes: "Hook: Attended cemetery preservation workshop at fair.\nSource: Community\nCampaign: Legacy Memorial Restorations - Yakima", score: 6, source_url: "" },
];

async function main() {
  console.log(`Starting import of ${leads.length} leads for client_id ${CLIENT_ID}...`);
  console.log("---");

  let imported = 0;
  let failed = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    try {
      const leadResult = await db.execute({
        sql: "INSERT INTO leads (contact_name, industry, location, notes, score, status, source_url) VALUES (?, ?, ?, ?, ?, 'new', ?)",
        args: [lead.name, lead.industry, lead.location, lead.notes, lead.score, lead.source_url],
      });
      const leadId = leadResult.lastInsertRowid;
      await db.execute({
        sql: "INSERT OR IGNORE INTO client_leads (client_id, lead_id) VALUES (?, ?)",
        args: [CLIENT_ID, leadId],
      });
      imported++;
    } catch (err) {
      failed++;
      console.error(`FAILED [${i + 1}] ${lead.name}: ${err.message}`);
    }

    if ((i + 1) % 10 === 0) {
      console.log(`Progress: ${i + 1}/${leads.length} processed (${imported} imported, ${failed} failed)`);
    }
  }

  console.log("---");
  console.log(`DONE! ${imported} leads imported, ${failed} failed.`);
  console.log(`Total leads in import: ${leads.length}`);
  console.log(`Client ID: ${CLIENT_ID}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
