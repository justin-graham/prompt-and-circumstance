from __future__ import annotations

import json

from common import PROCESSED, write_json


STAGE_SCALE = {
    "1": "Lab demo",
    "2": "Paid pilot",
    "3": "Narrow commercial task",
    "4": "Multi-site operational product",
    "5": "Occupation-level substitution evidence",
}


def source(label: str, url: str, date: str, source_type: str, supports: str) -> dict:
    return {
        "label": label,
        "url": url,
        "date": date,
        "source_type": source_type,
        "supports": supports,
    }


def track(
    *,
    company: str,
    system: str,
    stage: int,
    channel: str,
    task_coverage: str,
    claim_supported: str,
    confidence: str,
    note: str,
    sources: list[dict],
) -> dict:
    latest = max(item["date"] for item in sources)
    source_type = "mixed" if len({item["source_type"] for item in sources}) > 1 else sources[0]["source_type"]
    return {
        "status": "observed",
        "company": company,
        "system": system,
        "stage": stage,
        "channel": channel,
        "task_coverage": task_coverage,
        "claim_supported": claim_supported,
        "source_date": latest,
        "source_type": source_type,
        "confidence": confidence,
        "note": note,
        "sources": sources,
    }


def no_track(note: str, confidence: str = "medium") -> dict:
    return {
        "status": "none_found",
        "stage": None,
        "channel": "No credible occupation-targeting deployment",
        "task_coverage": "No credible humanoid task coverage identified",
        "claim_supported": "Absence of a credible public humanoid deployment targeting this occupation as of April 2026.",
        "source_date": "2026-04-30",
        "source_type": "manual review",
        "confidence": confidence,
        "note": note,
        "sources": [],
    }


FRONTIER = {
    "35-3023": {
        "specialized": track(
            company="Miso Robotics",
            system="Flippy fry station",
            stage=3,
            channel="Fixed automation",
            task_coverage="Fry station only: baskets, timing, and repetitive fryer handling inside quick-service kitchens.",
            claim_supported="Commercial kitchen deployments exist, but the claim is limited to a narrow fry-station slice rather than the full fast-food role.",
            confidence="medium",
            note="Flippy is relevant because it attacks a real, injury-prone fast-food subtask. The evidence should not be read as broad counter-worker automation: the system covers frying workflow, while ordering, assembly, stocking, cleaning, and customer exceptions remain outside scope.",
            sources=[
                source(
                    "Restaurant Dive, Jan 2025",
                    "https://www.restaurantdive.com/news/miso-robotics-develops-smaller-faster-flippy-white-castle-jack-in-the-box/738567/",
                    "2025-01-29",
                    "trade reporting",
                    "Describes new Flippy version and early 2025 installations, with deployment count caveat.",
                ),
                source(
                    "Miso Robotics, Jan 2025",
                    "https://misorobotics.com/newsroom/miso-launches-next-generation-flippy-fry-station-the-most-significant-evolution-of-the-ai-powered-robot-since-its-inception/",
                    "2025-01-28",
                    "company",
                    "Describes the next-generation fry-station system and planned installations.",
                ),
            ],
        ),
        "humanoid": track(
            company="Physical Intelligence",
            system="pi0.5 foundation model",
            stage=1,
            channel="Lab research",
            task_coverage="Adjacent food-handling and kitchen manipulation demos; no paid counter-service deployment.",
            claim_supported="Robot foundation-model demos show relevant manipulation primitives, not occupation-targeting deployment.",
            confidence="medium",
            note="The strongest humanoid-adjacent evidence is general manipulation in kitchens and homes. It is useful for the threshold-clearance argument, but it remains lab evidence rather than a commercial fast-food system.",
            sources=[
                source(
                    "Physical Intelligence, Apr 2025",
                    "https://www.physicalintelligence.company/blog/pi05",
                    "2025-04-22",
                    "research/company",
                    "Shows open-world manipulation generalization, including kitchen-style tasks.",
                )
            ],
        ),
    },
    "53-7062": {
        "specialized": track(
            company="Pickle Robot",
            system="Pickle truck unloader",
            stage=3,
            channel="Fixed automation",
            task_coverage="Trailer unloading: box lifting, transfer, and induction from trailers to conveyors.",
            claim_supported="Reported order activity and pilots support a narrow commercial unloading task, not the full material-mover occupation.",
            confidence="medium",
            note="Trailer unloading is one of the clearest manual material-handling slices because the task is repetitive, physically demanding, and measurable. The remaining occupation includes many other warehouse, stock, and freight-handling tasks.",
            sources=[
                source(
                    "Sourcing Journal, Dec 2025",
                    "https://sourcingjournal.com/topics/logistics/ups-pickle-robot-120-million-investment-robotics-warehouse-automation-pick-and-place-rollout-logistics-1234794119/",
                    "2025-12-19",
                    "trade reporting",
                    "Reports UPS order details and prior logistics pilots.",
                )
            ],
        ),
        "humanoid": track(
            company="Agility Robotics",
            system="Digit",
            stage=2,
            channel="Cobot / co-located",
            task_coverage="Tote movement and handoff in live fulfillment settings.",
            claim_supported="Commercial-site tote movement supports paid or customer-facing pilot evidence for logistics, but not broad material-mover substitution.",
            confidence="high",
            note="Digit provides the strongest public humanoid evidence in the top-ten list because it has moved high volumes of totes in a live logistics operation. The task remains bounded and co-located with human workflows.",
            sources=[
                source(
                    "Agility Robotics, Nov 2025",
                    "https://www.agilityrobotics.com/content/digit-moves-over-100k-totes",
                    "2025-11-20",
                    "company",
                    "Reports more than 100,000 totes moved at GXO's Flowery Branch facility.",
                )
            ],
        ),
    },
    "53-7065": {
        "specialized": track(
            company="Symbotic",
            system="AI-powered robotic warehouse system",
            stage=4,
            channel="Fixed automation",
            task_coverage="Distribution-center storage, retrieval, sequencing, and case handling.",
            claim_supported="Multi-site warehouse automation is well supported; occupation-level stocker/order-filler substitution is not directly estimated.",
            confidence="high",
            note="Symbotic is strong evidence that stock-flow tasks can move from individual workers into engineered warehouse systems. The better interpretation is task reallocation inside distribution networks rather than a complete occupation replacement measure.",
            sources=[
                source(
                    "Walmart and Symbotic, May 2022",
                    "https://www.symbotic.com/case-studies/walmart/",
                    "2022-05-23",
                    "company",
                    "Announces expansion of Symbotic systems to all 42 Walmart regional distribution centers over coming years.",
                ),
                source(
                    "Symbotic, Jan 2025",
                    "https://www.symbotic.com/about/news-events/news/symbotic-completes-acquisition-of-walmarts-advanced-systems-and-robotics-business-and-signs-related-commercial-agreement/",
                    "2025-01-28",
                    "company",
                    "Describes APD agreement, 400-system opportunity, and possible $5B-plus backlog increase.",
                ),
            ],
        ),
        "humanoid": track(
            company="Apptronik",
            system="Apollo",
            stage=2,
            channel="Cobot / co-located",
            task_coverage="Industrial and logistics partner pilots in controlled zones.",
            claim_supported="Public partnerships and funding support serious pilot activity, but public task-performance evidence is thinner than for fixed warehouse automation.",
            confidence="medium",
            note="Apollo is relevant because its customer set overlaps logistics and manufacturing. The evidence is still mostly partnership and financing signal, so it should sit below observed high-volume task operation.",
            sources=[
                source(
                    "Apptronik, Feb 2026",
                    "https://apptronik.com/news-collection/apptronik-closes-over-935-million-series-a",
                    "2026-02-11",
                    "company",
                    "Reports funding and partnerships with Mercedes-Benz, GXO Logistics, and Jabil.",
                ),
                source(
                    "TechCrunch, Feb 2026",
                    "https://techcrunch.com/2026/02/11/humanoid-robot-startup-apptronik-has-now-raised-935m-at-a-5b-valuation/",
                    "2026-02-11",
                    "reporting",
                    "Reports valuation and strategic partnerships.",
                ),
            ],
        ),
    },
    "35-3031": {
        "specialized": track(
            company="Bear Robotics",
            system="Servi",
            stage=4,
            channel="Autonomous vehicle",
            task_coverage="Food running, bussing support, and tray transport in restaurants and hospitality settings.",
            claim_supported="Multi-site service-robot deployment is credible, but it covers transport tasks rather than the whole waiter role.",
            confidence="medium",
            note="Servi is a useful case because it shows that a visible slice of table-service labor can be mechanized without solving the social and judgment-heavy parts of waiting tables.",
            sources=[
                source(
                    "TechCrunch, Jan 2025",
                    "https://techcrunch.com/2025/01/24/lg-electronics-takes-majority-stake-in-bear-robotics-reportedly-valuing-startup-at-600m/",
                    "2025-01-24",
                    "reporting",
                    "Reports LG's majority stake and Bear Robotics deployments across hospitality settings.",
                )
            ],
        ),
        "humanoid": no_track(
            "No credible public humanoid deployment appears to target table-service work directly. The form factor is less relevant than smaller mobile service robots for the transport slice.",
            "medium",
        ),
    },
    "37-2011": {
        "specialized": track(
            company="Avidbots",
            system="Neo / Neo 2 floor scrubbers",
            stage=4,
            channel="Autonomous vehicle",
            task_coverage="Autonomous floor scrubbing in airports, malls, warehouses, and large facilities.",
            claim_supported="Multi-site autonomous cleaning is credible for floor care; restrooms, trash, detail cleaning, stairs, and clutter remain outside the covered slice.",
            confidence="high",
            note="Janitorial automation is already real for predictable floor coverage. It is also a clean example of why task-level coverage matters: floor scrubbing can be advanced while the occupation remains far from fully automated.",
            sources=[
                source(
                    "The Robot Report, Feb 2024",
                    "https://www.therobotreport.com/neo-2-cleaning-robot-includes-avidbots-updates-ai-fleet-management/",
                    "2024-02-05",
                    "trade reporting",
                    "Describes Neo 2 updates and deployed cleaning use cases.",
                )
            ],
        ),
        "humanoid": track(
            company="1X Technologies",
            system="NEO",
            stage=1,
            channel="Teleoperation / home early access",
            task_coverage="Adjacent home tidying, surface wiping, and laundry claims; no commercial janitorial deployment.",
            claim_supported="Product claims and early-access positioning are relevant to home chores, not facility janitorial substitution.",
            confidence="low",
            note="NEO belongs here only as adjacent evidence about general manipulation in domestic spaces. It should be read as a frontier signal, not a janitorial labor-market deployment.",
            sources=[
                source(
                    "1X Technologies, NEO product page",
                    "https://www.1x.tech/neo",
                    "2026-04-30",
                    "company",
                    "Describes NEO home chores, Expert Mode, and remote-control features.",
                )
            ],
        ),
    },
    "53-3032": {
        "specialized": track(
            company="Aurora Innovation",
            system="Aurora Driver",
            stage=3,
            channel="Autonomous vehicle",
            task_coverage="Long-haul hub-to-hub Class 8 freight lanes, not local delivery, loading, inspection, or customer interaction.",
            claim_supported="Commercial driverless freight and 2026 route expansion are supported; occupation-level driver substitution remains lane- and operating-domain-specific.",
            confidence="high",
            note="Aurora is one of the strongest frontier cases because it has moved paid freight without a driver on public roads. The bounded operational domain matters: heavy-truck driving includes many routes and non-driving tasks outside the current lane network.",
            sources=[
                source(
                    "TechCrunch, May 2025",
                    "https://techcrunch.com/2025/05/01/aurora-launches-commercial-self-driving-truck-service-in-texas/",
                    "2025-05-01",
                    "reporting",
                    "Reports commercial driverless service launch between Dallas and Houston.",
                ),
                source(
                    "TechCrunch, Feb 2026",
                    "https://techcrunch.com/2026/02/12/auroras-driverless-trucks-can-now-travel-farther-distances-faster-than-human-drivers/",
                    "2026-02-12",
                    "reporting",
                    "Reports expanded routes and 250,000 driverless miles as of January 2026.",
                ),
            ],
        ),
        "humanoid": no_track(
            "A humanoid is not the relevant system for long-haul truck driving. The frontier is autonomous vehicle software and trucking operations, not human-form robots.",
            "high",
        ),
    },
    "49-9071": {
        "specialized": track(
            company="Boston Dynamics",
            system="Spot + Orbit fleet management",
            stage=4,
            channel="Autonomous vehicle",
            task_coverage="Inspection rounds, asset monitoring, thermal sensing, and data capture in industrial facilities.",
            claim_supported="Robotic inspection deployment is well supported; hands-on repair, diagnosis, and signoff remain outside scope.",
            confidence="high",
            note="Spot is strong evidence for inspection augmentation, not for autonomous general maintenance. It changes what workers can monitor and how often, while repair remains human-centered.",
            sources=[
                source(
                    "Boston Dynamics, 2025",
                    "https://bostondynamics.com/blog/retrospective-on-boston-dynamics-spot-robot-uses/",
                    "2025-01-01",
                    "company",
                    "Describes Spot deployments and industrial inspection use cases.",
                )
            ],
        ),
        "humanoid": track(
            company="Boston Dynamics",
            system="Atlas electric",
            stage=1,
            channel="Lab / internal factory demo",
            task_coverage="Adjacent whole-body manipulation and factory parts handling demos; no customer maintenance deployment.",
            claim_supported="Atlas demonstrates relevant mobility and manipulation primitives, not occupation-targeting deployment.",
            confidence="medium",
            note="Atlas is important as a capability marker for ladders, stairs, parts, and tools, but the public evidence is still demonstration-stage for this occupation.",
            sources=[
                source(
                    "Boston Dynamics, Atlas electric",
                    "https://bostondynamics.com/blog/electric-new-era-for-atlas/",
                    "2024-04-17",
                    "company",
                    "Introduces electric Atlas and its intended industrial learning path.",
                )
            ],
        ),
    },
    "51-2090": {
        "specialized": track(
            company="Universal Robots (Teradyne)",
            system="UR cobot family",
            stage=4,
            channel="Cobot / co-located",
            task_coverage="Machine tending, light assembly, pick-place, packaging, and repetitive industrial assistance.",
            claim_supported="Broad cobot deployment supports augmentation across assembly tasks, but not full automation of miscellaneous assembly occupations.",
            confidence="high",
            note="Cobots are the cleanest example of an augmentation pathway: they can shift repetitive handling while workers retain setup, quality judgment, fixture changes, and exception handling.",
            sources=[
                source(
                    "Robotics 24/7, May 2025",
                    "https://www.robotics247.com/article/automate-2025-universal-robots-introduces-ur15-cobot",
                    "2025-05-13",
                    "trade reporting",
                    "Reports UR15 launch and worldwide UR cobot deployment figures.",
                )
            ],
        ),
        "humanoid": track(
            company="Figure",
            system="Figure 02 / Figure 03",
            stage=2,
            channel="Cobot / co-located",
            task_coverage="Automotive sheet-metal loading and adjacent factory material handling.",
            claim_supported="BMW pilot evidence supports a bounded manufacturing task; 2026 production claims show fleet scaling, not deployment impact.",
            confidence="medium",
            note="Figure is compelling because the BMW task is a real production-adjacent assembly workflow. The right claim is still narrow: sheet-metal loading, not the full assembler/fabricator occupation.",
            sources=[
                source(
                    "Figure, Nov 2025",
                    "https://www.figure.ai/news/production-at-bmw",
                    "2025-11-19",
                    "company",
                    "Reports 11-month BMW Spartanburg deployment, 90,000-plus parts loaded, and 30,000-plus X3 vehicles.",
                ),
                source(
                    "Figure, Apr 2026",
                    "https://www.figure.ai/news/ramping-figure-03-production",
                    "2026-04-29",
                    "company",
                    "Reports Figure 03 production ramp and BotQ manufacturing progress.",
                ),
            ],
        ),
    },
    "35-2014": {
        "specialized": track(
            company="Sweetgreen / Wonder",
            system="Infinite Kitchen automated makeline",
            stage=3,
            channel="Fixed automation",
            task_coverage="Automated salad/bowl makeline in a constrained menu and store format.",
            claim_supported="Restaurant makeline deployments support a narrow food-assembly task, not restaurant cooking generally.",
            confidence="medium",
            note="Infinite Kitchen shows that menu engineering can turn parts of restaurant cooking into an automation-friendly flow. That is not the same as a general cook robot across cuisines, layouts, and peak-time failures.",
            sources=[
                source(
                    "Restaurant Technology News, Nov 2025",
                    "https://restauranttechnologynews.com/2025/11/sweetgreen-sells-restaurant-robotics-arm-to-wonder-while-continuing-infinite-kitchen-expansion/",
                    "2025-11-07",
                    "trade reporting",
                    "Reports Infinite Kitchen footprint, expansion plans, and Wonder transaction.",
                )
            ],
        ),
        "humanoid": track(
            company="Physical Intelligence",
            system="pi0 / pi0.5",
            stage=1,
            channel="Lab research",
            task_coverage="Adjacent meal-prep, table-bussing, grocery, and kitchen manipulation demos.",
            claim_supported="Robot foundation-model demos show relevant manipulation capabilities, not restaurant cook deployment.",
            confidence="medium",
            note="Physical Intelligence is valuable as capability evidence for deformable and kitchen objects. It remains a lab/research signal rather than a commercial cooking system.",
            sources=[
                source(
                    "Physical Intelligence, Oct 2024",
                    "https://www.physicalintelligence.company/blog/pi0",
                    "2024-10-31",
                    "research/company",
                    "Reports pi0 generalist policy and kitchen/food-adjacent manipulation tasks.",
                ),
                source(
                    "Physical Intelligence, Apr 2025",
                    "https://www.physicalintelligence.company/blog/pi05",
                    "2025-04-22",
                    "research/company",
                    "Reports pi0.5 open-world generalization in home and kitchen-like environments.",
                ),
            ],
        ),
    },
    "31-1131": {
        "specialized": track(
            company="Diligent Robotics",
            system="Moxi",
            stage=3,
            channel="Autonomous vehicle",
            task_coverage="Hospital logistics: supplies, samples, delivery runs, and elevator use. No patient handling or nursing care.",
            claim_supported="Hospital logistics automation is supported; nursing-assistant task automation is deliberately not claimed.",
            confidence="high",
            note="Moxi is useful because it shows a real healthcare augmentation pathway while also marking the boundary clearly: logistics can move to robots before patient-facing care does.",
            sources=[
                source(
                    "The Robot Report, Feb 2025",
                    "https://www.therobotreport.com/diligent-robotics-hits-1m-picks-with-moxi-robot-in-healthcare-settings/",
                    "2025-02-18",
                    "trade reporting",
                    "Reports Moxi hospital activity and one-million-pick milestone.",
                ),
                source(
                    "TechCrunch, Jan 2026",
                    "https://techcrunch.com/2026/01/20/why-serve-robotics-is-acquiring-a-hospital-assistant-robot-company/",
                    "2026-01-20",
                    "reporting",
                    "Reports Serve Robotics acquisition of Diligent Robotics and healthcare logistics focus.",
                ),
            ],
        ),
        "humanoid": track(
            company="1X Technologies",
            system="NEO",
            stage=1,
            channel="Teleoperation / home early access",
            task_coverage="Adjacent eldercare and home-assistance positioning; no clinical patient-handling pilot.",
            claim_supported="Product positioning is relevant to home assistance but does not support nursing-assistant deployment.",
            confidence="low",
            note="NEO should be treated as adjacent home-care evidence. It is not evidence that humanoids can safely perform patient transfers, bathing, toileting, or clinical observation in care settings.",
            sources=[
                source(
                    "1X Technologies, NEO product page",
                    "https://www.1x.tech/neo",
                    "2026-04-30",
                    "company",
                    "Describes NEO home assistance, Expert Mode, and remote operation.",
                )
            ],
        ),
    },
}


def main() -> None:
    with (PROCESSED / "summary_national.json").open("r", encoding="utf-8") as f:
        top_missing = json.load(f)["top_10_invisible_occupations"]

    occupations = []
    for occupation in top_missing:
        soc_code = occupation["soc_code"]
        if soc_code not in FRONTIER:
            raise KeyError(f"No robotics frontier evidence for {soc_code}")
        occupations.append(
            {
                "soc_code": soc_code,
                "title": occupation["title"],
                "national_employment": occupation["national_employment"],
                **FRONTIER[soc_code],
            }
        )

    payload = {
        "snapshot_date": "2026-04-30",
        "snapshot_label": "April 2026",
        "stage_scale": STAGE_SCALE,
        "schema_version": 2,
        "occupations": occupations,
    }
    write_json(PROCESSED / "robotics_frontier.json", payload)
    print("Robotics frontier")
    print(f"  occupations: {len(occupations)}")
    print(
        "  observed tracks: "
        f"{sum(1 for row in occupations for key in ['specialized', 'humanoid'] if row[key]['status'] == 'observed')}"
    )
    print(
        "  explicit no-deployment tracks: "
        f"{sum(1 for row in occupations for key in ['specialized', 'humanoid'] if row[key]['status'] == 'none_found')}"
    )


if __name__ == "__main__":
    main()
