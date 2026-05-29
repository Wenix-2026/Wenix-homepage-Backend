<?php
namespace App\Entity\Tenant;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity]
#[ORM\Table(name: 'ticket')]
class Ticket
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $userEmail;

    #[ORM\Column(length: 50)]
    private string $type;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $category = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $targetEshop = null;

    #[ORM\Column(type: 'text')]
    private string $message;

    #[ORM\Column(length: 50)]
    private string $status = 'Nový';

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\OneToMany(targetEntity: TicketMessage::class, mappedBy: 'ticket', cascade: ['persist', 'remove'])]
    #[ORM\OrderBy(['createdAt' => 'ASC'])]
    private Collection $messages;

    public function __construct()
    {

        $this->createdAt = new \DateTimeImmutable();
        $this->messages  = new ArrayCollection();
    }

    public function getMessages(): Collection { return $this->messages; }
    public function getId(): ?int { return $this->id; }
    public function getUserEmail(): string { return $this->userEmail; }
    public function setUserEmail(string $userEmail): static { $this->userEmail = $userEmail; return $this; }
    public function getType(): string { return $this->type; }
    public function setType(string $type): static { $this->type = $type; return $this; }
    public function getCategory(): ?string { return $this->category; }
    public function setCategory(?string $category): static { $this->category = $category; return $this; }
    public function getTargetEshop(): ?string { return $this->targetEshop; }
    public function setTargetEshop(?string $targetEshop): static { $this->targetEshop = $targetEshop; return $this; }
    public function getMessage(): string { return $this->message; }
    public function setMessage(string $message): static { $this->message = $message; return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
