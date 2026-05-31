import { Router } from "express";

import { getConnectionsForOrganization, enableOrgConnection, disableOrgConnection, deleteOrgConnection, updateOrgConnectionConfig } from "./connection.service.js";
import { requireOwner } from "../middleware.js";

const router = Router();

router.get("/", async (req, res) => {
    const orgId = req.orgId

    const connections = await getConnectionsForOrganization(orgId);

    res.status(200).json(connections)
})

router.use(requireOwner)

router.post("/:connectionId/connect",
    async (req, res) => {
        const orgId = req.orgId
        const connectionId = req.params.connectionId
        const config = req.body.config
        console.log(orgId, connectionId, config)

        const orgConnection = await enableOrgConnection(orgId, connectionId, config)

        res.status(201).json(orgConnection)
    }
)

router.patch("/:orgConnectionId/disable",
    async (req, res) => {
        const orgId = req.orgId
        const orgConnectionId = req.params.orgConnectionId

        await disableOrgConnection(orgId, orgConnectionId)

        res.status(204).end()
    }
)

router.patch("/:orgConnectionId/config",
    async (req, res) => {
        const orgId = req.orgId
        const orgConnectionId = req.params.orgConnectionId
        const config = req.body.config

        await updateOrgConnectionConfig(orgId, orgConnectionId, config)

        res.status(200).json({
            success: true
        })
    }
)

router.delete("/:orgConnectionId",
    async (req, res) => {
        const orgId = req.orgId
        const orgConnectionId = req.params.orgConnectionId
        
        await deleteOrgConnection(orgId, orgConnectionId)

        res.status(200).json({
            success: true
        })
    }
)

export default router;
