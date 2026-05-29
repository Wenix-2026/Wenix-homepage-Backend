<?php
// src/Entity/Tenant/TicketMessage.php

namespace App\Entity\Tenant;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'ticket_message')]
class TicketMessage
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Ticket::class, inversedBy: 'messages')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Ticket $ticket;

    #[ORM\Column(length: 255)]
    private string $senderEmail;

    #[ORM\Column(type: 'text')]
    private string $message;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getTicket(): Ticket { return $this->ticket; }
    public function setTicket(Ticket $ticket): static { $this->ticket = $ticket; return $this; }
    public function getSenderEmail(): string { return $this->senderEmail; }
    public function setSenderEmail(string $senderEmail): static { $this->senderEmail = $senderEmail; return $this; }
    public function getMessage(): string { return $this->message; }
    public function setMessage(string $message): static { $this->message = $message; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
